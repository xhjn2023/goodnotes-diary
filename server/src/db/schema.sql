-- Supabase diaries 表结构
-- 在 Supabase SQL Editor 中执行此文件

-- 启用扩展
create extension if not exists "pgcrypto";

-- 日记表
create table if not exists diaries (
  id          text primary key,                          -- 客户端生成的字符串ID（与小程序一致）
  content     text not null default '',                   -- 日记正文
  mood        text not null default '',                   -- 心情 emoji
  tags        text[] not null default '{}',              -- 标签数组
  date        date not null,                              -- 日记日期（YYYY-MM-DD）
  created_at  timestamptz not null default now(),        -- 创建时间
  updated_at  timestamptz not null default now(),         -- 更新时间
  user_id    text default 'default'                       -- 预留用户字段
);

-- 索引
create index if not exists idx_diaries_date      on diaries (date desc);
create index if not exists idx_diaries_user_date on diaries (user_id, date desc);
create index if not exists idx_diaries_tags      on diaries using gin (tags);

-- 自动更新 updated_at 触发器
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_diaries_touch on diaries;
create trigger trg_diaries_touch
  before update on diaries
  for each row execute function touch_updated_at();

-- 全文搜索：使用 ilike 兜底（中文 simple 词典效果有限，ilike 已足够覆盖日记规模）
-- 如需高性能全文搜索，可后续单独添加 tsvector 列 + 触发器维护

-- 注释
comment on table  diaries            is '日记表';
comment on column diaries.id         is '客户端生成的字符串ID';
comment on column diaries.mood       is '心情 emoji';
comment on column diaries.tags       is '标签数组';
