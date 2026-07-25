# GoodNotes 数据库设计文档

> 版本:v1.0
> 更新日期:2026-07-14
> 文档负责人:技术组

---

## 1. 文档概述

### 1.1 文档目的
本文档定义 GoodNotes 笔记 App 的数据库设计,包含**本地 SQLite** 与**服务端 MongoDB** 两套数据模型,以及同步机制的字段映射。

### 1.2 数据存储分布

| 存储位置 | 技术 | 用途 |
|---------|------|------|
| 客户端本地 | SQLite (expo-sqlite) | 离线数据源,所有读写直接操作 |
| 服务端主库 | MongoDB | 云端数据持久化,多端同步中枢 |
| 服务端缓存 | Redis | 会话、限流、热点数据 |
| 对象存储 | OSS | 图片、附件文件 |

---

## 2. 本地数据库设计 (SQLite)

### 2.1 ER 关系图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  notebooks   │       │    notes     │       │     tags     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)      │   ┌──►│ id (PK)      │
│ name         │   │   │ title        │   │   │ name         │
│ parent_id    │   └───│ notebook_id  │   │   │ color        │
│ sort_order   │       │ content      │   │   │ created_at   │
│ created_at   │       │ ...          │   │   └──────────────┘
│ updated_at   │       └──────┬───────┘   │
└──────────────┘              │           │
                              │           │
                              ▼           │
                    ┌──────────────────┐  │
                    │   note_tags      │  │
                    ├──────────────────┤  │
                    │ note_id (FK)     │──┘
                    │ tag_id (FK)      │
                    └──────────────────┘
```

### 2.2 表结构定义

#### 2.2.1 notes 表(笔记主表)

```sql
CREATE TABLE notes (
  id                TEXT PRIMARY KEY,        -- UUID,客户端生成
  title             TEXT DEFAULT '',         -- 标题
  content           TEXT DEFAULT '',         -- HTML 富文本内容
  excerpt           TEXT DEFAULT '',         -- 摘要(列表展示用,前 100 字)
  notebook_id       TEXT,                    -- 所属笔记本 ID
  is_pinned         INTEGER DEFAULT 0,       -- 是否置顶 0/1
  is_deleted        INTEGER DEFAULT 0,       -- 是否软删除 0/1
  is_locked         INTEGER DEFAULT 0,       -- 是否加密 0/1
  created_at        INTEGER NOT NULL,        -- 创建时间(毫秒)
  updated_at        INTEGER NOT NULL,        -- 更新时间(毫秒)
  deleted_at        INTEGER,                 -- 删除时间(用于回收站清理)
  version           INTEGER DEFAULT 1,       -- 乐观锁版本号
  sync_status       TEXT DEFAULT 'pending',  -- pending|synced|conflict
  server_updated_at INTEGER,                 -- 服务端最后更新时间
  FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
);

-- 索引
CREATE INDEX idx_notes_notebook ON notes(notebook_id);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_sync ON notes(sync_status);
CREATE INDEX idx_notes_deleted ON notes(is_deleted);
CREATE INDEX idx_notes_pinned ON notes(is_pinned DESC, updated_at DESC);
```

#### 2.2.2 notebooks 表(笔记本)

```sql
CREATE TABLE notebooks (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  parent_id    TEXT,                         -- 父笔记本(支持多级)
  icon         TEXT,                         -- 图标
  color        TEXT,                         -- 颜色
  sort_order   INTEGER DEFAULT 0,            -- 排序
  note_count   INTEGER DEFAULT 0,            -- 笔记数(冗余字段)
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  sync_status  TEXT DEFAULT 'pending',
  server_updated_at INTEGER,
  FOREIGN KEY (parent_id) REFERENCES notebooks(id)
);

CREATE INDEX idx_notebooks_parent ON notebooks(parent_id);
```

#### 2.2.3 tags 表(标签)

```sql
CREATE TABLE tags (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  color        TEXT,                         -- 颜色 hex
  note_count   INTEGER DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  sync_status  TEXT DEFAULT 'pending',
  server_updated_at INTEGER
);
```

#### 2.2.4 note_tags 表(笔记-标签关联)

```sql
CREATE TABLE note_tags (
  note_id      TEXT NOT NULL,
  tag_id       TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);
```

#### 2.2.5 attachments 表(附件)

```sql
CREATE TABLE attachments (
  id           TEXT PRIMARY KEY,
  note_id      TEXT NOT NULL,
  type         TEXT NOT NULL,                -- image|audio|file
  local_path   TEXT,                         -- 本地路径
  remote_url   TEXT,                         -- 远端 URL
  file_size    INTEGER,                      -- 文件大小(字节)
  mime_type    TEXT,
  width        INTEGER,                      -- 图片宽
  height       INTEGER,                      -- 图片高
  duration     INTEGER,                      -- 音频时长(毫秒)
  created_at   INTEGER NOT NULL,
  sync_status  TEXT DEFAULT 'pending',
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_note ON attachments(note_id);
```

#### 2.2.6 note_versions 表(版本历史)

```sql
CREATE TABLE note_versions (
  id           TEXT PRIMARY KEY,
  note_id      TEXT NOT NULL,
  title        TEXT,
  content      TEXT,
  version      INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_versions_note ON note_versions(note_id, created_at DESC);
```

#### 2.2.7 sync_state 表(同步状态)

```sql
CREATE TABLE sync_state (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- 初始化数据
INSERT INTO sync_state (key, value) VALUES
  ('last_sync_time', '0'),
  ('device_id', ?),           -- 首次启动生成
  ('user_id', NULL),
  ('is_logged_in', '0');
```

#### 2.2.8 全文搜索虚拟表(FTS5)

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  note_id UNINDEXED,
  title,
  content,
  tokenize = 'unicode61'      -- 支持中文分词(简化版)
);

-- 触发器:笔记变更时同步 FTS
CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(note_id, title, content)
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
  DELETE FROM notes_fts WHERE note_id = old.id;
  INSERT INTO notes_fts(note_id, title, content)
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
  DELETE FROM notes_fts WHERE note_id = old.id;
END;
```

---

## 3. 服务端数据库设计 (MongoDB)

### 3.1 集合关系

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   users      │       │    notes     │       │  notebooks   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ _id          │◄──┐   │ _id          │   ┌──►│ _id          │
│ email        │   │   │ userId       │   │   │ userId       │
│ password     │   └───│ notebookId   │   │   │ name         │
│ ...          │       │ tags:[]      │───┘   │ parentId     │
└──────────────┘       │ ...          │       └──────────────┘
                       └──────────────┘
```

### 3.2 集合 Schema 定义

#### 3.2.1 users 集合(用户)

```javascript
// server/src/models/User.js
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,            // bcrypt 加密
    required: true,
  },
  nickname: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,            // OSS URL
    default: '',
  },
  deviceId: [{
    type: String,            // 设备 ID 列表
  }],
  storageUsed: {
    type: Number,            // 已用存储(字节)
    default: 0,
  },
  storageLimit: {
    type: Number,            // 存储上限
    default: 1024 * 1024 * 1024,  // 1GB
  },
  lastLoginAt: Date,
  status: {
    type: String,
    enum: ['active', 'banned', 'deleted'],
    default: 'active',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1, status: 1 });
```

#### 3.2.2 notes 集合(笔记)

```javascript
// server/src/models/Note.js
const noteSchema = new mongoose.Schema({
  _id: {
    type: String,            // 客户端生成的 UUID
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  excerpt: { type: String, default: '' },
  notebookId: { type: String, default: null, index: true },
  tags: [{ type: String }],  // 标签 ID 数组
  attachments: [{
    id: String,
    type: String,            // image|audio|file
    url: String,
    size: Number,
    mimeType: String,
    width: Number,
    height: Number,
    duration: Number,
  }],
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  version: { type: Number, default: 1 },    // 乐观锁
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
});

// 复合索引
noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, notebookId: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ userId: 1, tags: 1 });

// 文本索引(服务端搜索)
noteSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
}, {
  weights: { title: 3, excerpt: 2, content: 1 },
  name: 'note_text_index',
});
```

#### 3.2.3 notebooks 集合(笔记本)

```javascript
const notebookSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  parentId: { type: String, default: null, index: true },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#8E8E93' },
  sortOrder: { type: Number, default: 0 },
  noteCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

notebookSchema.index({ userId: 1, parentId: 1, sortOrder: 1 });
```

#### 3.2.4 tags 集合(标签)

```javascript
const tagSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  color: { type: String, default: '#8E8E93' },
  noteCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

tagSchema.index({ userId: 1, name: 1 }, { unique: true });
```

#### 3.2.5 sync_logs 集合(同步日志,审计用)

```javascript
const syncLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  deviceId: { type: String, required: true },
  action: { type: String, enum: ['push', 'pull'], required: true },
  noteCount: { type: Number, default: 0 },
  conflictCount: { type: Number, default: 0 },
  duration: { type: Number },        // 耗时(毫秒)
  status: { type: String, enum: ['success', 'failed'] },
  error: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

// TTL 索引,90 天自动过期
syncLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
```

---

## 4. 字段映射(本地 ↔ 服务端)

由于本地 SQLite 与服务端 MongoDB 字段命名风格不同(snake_case vs camelCase),同步时需做映射:

| 本地字段 (SQLite) | 服务端字段 (MongoDB) | 说明 |
|------------------|---------------------|------|
| id | _id | 主键 |
| title | title | 标题 |
| content | content | 正文 |
| notebook_id | notebookId | 笔记本 ID |
| is_pinned | isPinned | 是否置顶 |
| is_deleted | isDeleted | 是否删除 |
| is_locked | isLocked | 是否加密 |
| created_at | createdAt | 创建时间 |
| updated_at | updatedAt | 更新时间 |
| deleted_at | deletedAt | 删除时间 |
| version | version | 乐观锁版本 |
| sync_status | - | 仅本地 |
| server_updated_at | - | 仅本地,用于增量拉取 |

### 映射函数

```javascript
// shared/mapper.js
function localToServer(localNote) {
  return {
    _id: localNote.id,
    title: localNote.title,
    content: localNote.content,
    notebookId: localNote.notebook_id,
    isPinned: !!localNote.is_pinned,
    isDeleted: !!localNote.is_deleted,
    isLocked: !!localNote.is_locked,
    version: localNote.version,
    createdAt: new Date(localNote.created_at),
    updatedAt: new Date(localNote.updated_at),
    deletedAt: localNote.deleted_at ? new Date(localNote.deleted_at) : null,
  };
}

function serverToLocal(serverNote) {
  return {
    id: serverNote._id,
    title: serverNote.title,
    content: serverNote.content,
    notebook_id: serverNote.notebookId,
    is_pinned: serverNote.isPinned ? 1 : 0,
    is_deleted: serverNote.isDeleted ? 1 : 0,
    is_locked: serverNote.isLocked ? 1 : 0,
    version: serverNote.version,
    created_at: new Date(serverNote.createdAt).getTime(),
    updated_at: new Date(serverNote.updatedAt).getTime(),
    deleted_at: serverNote.deletedAt ? new Date(serverNote.deletedAt).getTime() : null,
    sync_status: 'synced',
    server_updated_at: new Date(serverNote.updatedAt).getTime(),
  };
}
```

---

## 5. 同步机制详细设计

### 5.1 同步状态机

```
                              ┌─────────┐
                              │ pending │ ◄── 用户编辑触发
                              └────┬────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                          ▼                 ▼
                    ┌──────────┐      ┌──────────┐
                    │  synced  │      │ conflict │
                    └──────────┘      └────┬─────┘
                          ▲                 │
                          │                 │ 用户解决冲突
                          └─────────────────┘
```

### 5.2 增量同步逻辑

#### 5.2.1 客户端推送(Push)

```javascript
// mobile/src/services/syncService.js
async function pushChanges() {
  // 1. 查询所有 pending 笔记
  const pendingNotes = await noteDao.getBySyncStatus('pending');

  if (pendingNotes.length === 0) return;

  // 2. 转换为服务端格式
  const changes = pendingNotes.map(localToServer);

  // 3. 调用推送接口
  const result = await api.post('/sync/push', { changes });

  // 4. 处理结果
  for (const noteId of result.applied) {
    await noteDao.updateSyncStatus(noteId, 'synced');
  }

  for (const conflict of result.conflicts) {
    await noteDao.markConflict(conflict.id, conflict.serverVersion);
  }
}
```

#### 5.2.2 客户端拉取(Pull)

```javascript
async function pullChanges() {
  const lastSyncTime = await syncStateDao.get('last_sync_time');

  // 1. 拉取服务端变更
  const response = await api.get('/sync/pull', {
    params: { since: lastSyncTime }
  });

  // 2. 合并到本地
  for (const serverNote of response.changes) {
    const localNote = await noteDao.getById(serverNote._id);

    if (!localNote) {
      // 本地不存在,直接插入
      await noteDao.insert(serverToLocal(serverNote));
    } else if (serverNote.updatedAt > localNote.server_updated_at) {
      // 服务端更新,覆盖本地
      await noteDao.upsert(serverToLocal(serverNote));
    }
  }

  // 3. 更新同步时间
  await syncStateDao.set('last_sync_time', response.serverTime);
}
```

#### 5.2.3 服务端拉取接口

```javascript
// server/src/controllers/syncController.js
async function pullChanges(req, res) {
  const userId = req.userId;
  const since = new Date(parseInt(req.query.since) || 0);

  // 查询该用户 since 之后所有变更
  const changes = await Note.find({
    userId,
    updatedAt: { $gt: since },
  }).sort({ updatedAt: 1 });

  res.json({
    code: 0,
    data: {
      changes,
      serverTime: Date.now(),
      hasMore: changes.length === 100,  // 分页标识
    },
  });
}
```

### 5.3 冲突处理策略

#### 5.3.1 冲突检测条件
```
冲突 = 同一笔记 && 客户端版本号 < 服务端版本号
       或
       同一笔记 && 客户端 & 服务端都在 last_sync_time 之后被修改
```

#### 5.3.2 解决策略

| 策略 | 适用场景 | 实现 |
|------|---------|------|
| **服务端优先** | 默认策略 | 服务端版本覆盖客户端 |
| **客户端优先** | 用户选择 | 客户端版本覆盖服务端 |
| **合并保留两份** | 重要笔记 | 服务端版本作为新笔记副本 |
| **手动合并** | 复杂冲突 | 弹出对比界面,用户手动编辑 |

```javascript
// 客户端冲突解决界面
async function resolveConflict(noteId, strategy) {
  switch (strategy) {
    case 'keep_local':
      await noteDao.updateSyncStatus(noteId, 'pending');
      await syncService.pushChanges();
      break;

    case 'keep_server':
      const serverNote = await api.get(`/notes/${noteId}`);
      await noteDao.upsert(serverToLocal(serverNote.data));
      await noteDao.updateSyncStatus(noteId, 'synced');
      break;

    case 'keep_both':
      // 复制本地版本为新笔记
      const local = await noteDao.getById(noteId);
      await noteDao.insert({
        ...local,
        id: uuid(),
        title: `${local.title} (副本)`,
        sync_status: 'pending',
      });
      // 本地原笔记用服务端版本覆盖
      const server = await api.get(`/notes/${noteId}`);
      await noteDao.upsert(serverToLocal(server.data));
      break;
  }
}
```

---

## 6. 数据迁移与维护

### 6.1 数据库版本管理

```javascript
// mobile/src/db/migrations.js
const MIGRATIONS = [
  {
    version: 1,
    sql: [
      `CREATE TABLE notes (...)`,
      `CREATE TABLE notebooks (...)`,
      // ... v1 初始化
    ],
  },
  {
    version: 2,
    sql: [
      `ALTER TABLE notes ADD COLUMN is_locked INTEGER DEFAULT 0`,
    ],
  },
];

async function runMigrations(db) {
  const currentVersion = await db.getFirstAsync(
    'PRAGMA user_version'
  );

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      for (const sql of migration.sql) {
        await db.execAsync(sql);
      }
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    }
  }
}
```

### 6.2 数据清理策略

| 数据 | 保留策略 | 清理时机 |
|------|---------|---------|
| 回收站笔记 | 30 天 | 每日定时任务 |
| 版本历史 | 每笔记最近 50 版本 | 新版本写入时 |
| 同步日志 | 90 天 | TTL 索引自动 |
| 临时附件 | 7 天未关联笔记 | 每周扫描 |

### 6.3 备份策略

- **MongoDB**:每日全量备份 + Oplog 增量备份,保留 7 天
- **OSS**:版本管理,保留 30 天历史版本
- **灾难恢复**:RPO ≤ 1 小时,RTO ≤ 4 小时

---

## 7. 索引优化分析

### 7.1 慢查询场景与索引

| 查询场景 | SQL/查询 | 优化索引 |
|---------|---------|---------|
| 首页笔记列表 | `WHERE notebook_id=? AND is_deleted=0 ORDER BY is_pinned DESC, updated_at DESC` | idx_notes_pinned |
| 同步推送查询 | `WHERE sync_status='pending'` | idx_notes_sync |
| 全文搜索 | `WHERE notes_fts MATCH ?` | FTS5 虚拟表 |
| 按标签筛选 | `JOIN note_tags WHERE tag_id=?` | idx_note_tags_tag |
| 增量拉取 | `WHERE userId=? AND updatedAt>?` | userId+updatedAt 复合 |

### 7.2 索引维护
- 每周 `ANALYZE` 更新统计信息(SQLite)
- 每月 `REINDEX` 重建碎片化索引
- MongoDB 每月检查索引使用率,删除无用索引

---

## 8. 安全设计

### 8.1 敏感字段加密

| 字段 | 加密方式 | 说明 |
|------|---------|------|
| notes.content | AES-256 (仅 is_locked=1) | 用户标记为加密的笔记 |
| users.password | bcrypt (cost=12) | 单向哈希 |
| sync_state.user_id | - | 不加密,但本地存储 |
| Token | expo-secure-store | 系统级加密存储 |

### 8.2 SQL 注入防护
- 所有查询使用参数化绑定
- DAO 层禁止字符串拼接 SQL
- 服务端使用 Mongoose Schema 校验

```javascript
// ✅ 正确:参数化查询
db.getFirstAsync('SELECT * FROM notes WHERE id = ?', [noteId]);

// ❌ 错误:字符串拼接
db.getFirstAsync(`SELECT * FROM notes WHERE id = '${noteId}'`);
```

---

## 9. 数据量评估

### 9.1 单用户数据量预估

| 数据类型 | 单条大小 | 月增量 | 年累计 |
|---------|---------|--------|--------|
| 笔记(纯文本) | 5 KB | 90 条 = 450 KB | 5.4 MB |
| 笔记(含图片) | 500 KB | 30 条 = 15 MB | 180 MB |
| 版本历史 | 5 KB × 10 版本 | 9 MB | 108 MB |
| 附件 | 1 MB | 10 个 = 10 MB | 120 MB |
| **合计** | - | - | **~400 MB/年** |

### 9.2 服务端容量规划

| 用户量 | 数据量 | 存储规划 |
|--------|--------|---------|
| 1 万 | 4 TB | MongoDB 单节点 + OSS |
| 10 万 | 40 TB | MongoDB 副本集 + OSS |
| 100 万 | 400 TB | MongoDB 分片 + OSS |

---

## 10. 附录

### 10.1 数据字典速查

| 表/集合 | 主键 | 关键字段 | 说明 |
|--------|------|---------|------|
| notes | id (UUID) | title, content, version | 笔记主表 |
| notebooks | id | name, parent_id | 笔记本层级 |
| tags | id | name, color | 标签 |
| note_tags | (note_id, tag_id) | - | 关联表 |
| attachments | id | note_id, type, url | 附件 |
| note_versions | id | note_id, version | 版本历史 |
| sync_state | key | value | 同步元数据 |
| sync_logs | _id | userId, action | 同步审计 |

### 10.2 相关文档
- PRD 文档:`docs/PRD.md`
- 技术设计文档:`docs/Design.md`
- API 接口文档:`docs/API.md`(后续输出)
