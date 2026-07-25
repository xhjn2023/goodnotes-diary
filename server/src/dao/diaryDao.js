// src/dao/diaryDao.js — 日记数据访问层
// 接口与小程序端 utils/storage.js 保持一致，便于后续替换或双写
import { query } from '../config/database.js';

// 全部日记（倒序：date desc，同日期 createdAt desc）
export async function getAll(userId = 'default') {
  const { rows } = await query(
    `SELECT id, content, mood, tags, to_char(date, 'YYYY-MM-DD') AS date,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM diaries
     WHERE user_id = $1
     ORDER BY date DESC, created_at DESC`,
    [userId]
  );
  return rows.map(normalize);
}

// 按 id 获取
export async function getById(id, userId = 'default') {
  const { rows } = await query(
    `SELECT id, content, mood, tags, to_char(date, 'YYYY-MM-DD') AS date,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM diaries
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId]
  );
  return rows.length ? normalize(rows[0]) : null;
}

// 新建
export async function create(data, userId = 'default') {
  const id = data.id || genId();
  const { rows } = await query(
    `INSERT INTO diaries (id, content, mood, tags, date, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, content, mood, tags, to_char(date, 'YYYY-MM-DD') AS date,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, (data.content || '').trim(), data.mood || '', data.tags || [], data.date, userId]
  );
  return normalize(rows[0]);
}

// 更新
export async function update(id, patch, userId = 'default') {
  const sets = [];
  const vals = [];
  let i = 1;
  if (patch.content !== undefined) { sets.push(`content = $${i++}`); vals.push(patch.content.trim()); }
  if (patch.mood !== undefined)    { sets.push(`mood = $${i++}`); vals.push(patch.mood); }
  if (patch.tags !== undefined)    { sets.push(`tags = $${i++}`); vals.push(patch.tags); }
  if (patch.date !== undefined)    { sets.push(`date = $${i++}`); vals.push(patch.date); }
  if (!sets.length) return getById(id, userId);
  vals.push(id, userId);
  const { rows } = await query(
    `UPDATE diaries SET ${sets.join(', ')}
     WHERE id = $${i++} AND user_id = $${i++}
     RETURNING id, content, mood, tags, to_char(date, 'YYYY-MM-DD') AS date,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    vals
  );
  return rows.length ? normalize(rows[0]) : null;
}

// 删除
export async function remove(id, userId = 'default') {
  const res = await query(
    `DELETE FROM diaries WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return res.rowCount > 0;
}

// 关键词搜索（ilike 匹配正文/标签数组）
export async function search(keyword, userId = 'default') {
  const kw = (keyword || '').trim();
  if (!kw) return getAll(userId);
  const { rows } = await query(
    `SELECT id, content, mood, tags, to_char(date, 'YYYY-MM-DD') AS date,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM diaries
     WHERE user_id = $1
       AND (content ILIKE '%' || $2 || '%'
            OR $2 = ANY(tags)
            OR mood = $2)
     ORDER BY date DESC, created_at DESC`,
    [userId, kw]
  );
  return rows.map(normalize);
}

// 按月归档
export async function getArchive(userId = 'default') {
  const { rows } = await query(
    `SELECT to_char(date, 'YYYY-MM') AS month,
            count(*)::int AS count
     FROM diaries
     WHERE user_id = $1
     GROUP BY month
     ORDER BY month DESC`,
    [userId]
  );
  return rows;
}

// 统计
export async function count(userId = 'default') {
  const { rows } = await query(
    `SELECT count(*)::int AS cnt FROM diaries WHERE user_id = $1`,
    [userId]
  );
  return rows[0].cnt;
}

// ============ 工具 ============
function normalize(row) {
  if (!row) return row;
  return {
    id: row.id,
    content: row.content || '',
    mood: row.mood || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    date: row.date || '',
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : row.updatedAt
  };
}

function genId() {
  const seq = Math.floor(Math.random() * 1000000).toString(36);
  return 'd' + Date.now().toString(36) + seq + Math.random().toString(36).slice(2, 6);
}
