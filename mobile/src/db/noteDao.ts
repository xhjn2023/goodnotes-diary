import { v4 as uuidv4 } from 'uuid';
import { getDB } from './schema';
import type { Note, NoteInput, NoteUpdate } from '@/types';

// 将数据库行转换为 Note 对象
function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    notebookId: row.notebook_id,
    isPinned: !!row.is_pinned,
    isDeleted: !!row.is_deleted,
    isLocked: !!row.is_locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    syncStatus: row.sync_status,
    serverUpdatedAt: row.server_updated_at,
  };
}

// 从 HTML 内容生成摘要
function makeExcerpt(html: string, maxLen = 100): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// 获取笔记列表(非回收站)
export async function listNotes(notebookId?: string | null): Promise<Note[]> {
  const db = await getDB();
  const params: any[] = [0]; // is_deleted = 0
  let sql = `
    SELECT * FROM notes
    WHERE is_deleted = ?
  `;
  if (notebookId !== undefined) {
    sql += ` AND notebook_id ${notebookId === null ? 'IS NULL' : '= ?'}`;
    if (notebookId !== null) params.push(notebookId);
  }
  sql += ` ORDER BY is_pinned DESC, updated_at DESC`;

  const rows = await db.getAllAsync(sql, params);
  return rows.map(rowToNote);
}

// 获取单条笔记
export async function getNoteById(id: string): Promise<Note | null> {
  const db = await getDB();
  const row = await db.getFirstAsync('SELECT * FROM notes WHERE id = ?', [id]);
  return row ? rowToNote(row) : null;
}

// 创建笔记
export async function createNote(input: NoteInput): Promise<Note> {
  const db = await getDB();
  const now = Date.now();
  const note: Note = {
    id: uuidv4(),
    title: input.title || '',
    content: input.content || '',
    excerpt: makeExcerpt(input.content || ''),
    notebookId: input.notebookId || null,
    isPinned: false,
    isDeleted: false,
    isLocked: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    syncStatus: 'pending',
    serverUpdatedAt: null,
  };

  await db.runAsync(
    `INSERT INTO notes (id, title, content, excerpt, notebook_id, is_pinned, is_deleted, is_locked, created_at, updated_at, deleted_at, version, sync_status, server_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [note.id, note.title, note.content, note.excerpt, note.notebookId,
     note.isPinned ? 1 : 0, note.isDeleted ? 1 : 0, note.isLocked ? 1 : 0,
     note.createdAt, note.updatedAt, note.deletedAt, note.version, note.syncStatus, note.serverUpdatedAt]
  );

  return note;
}

// 更新笔记
export async function updateNote(id: string, updates: NoteUpdate): Promise<Note | null> {
  const db = await getDB();
  const existing = await getNoteById(id);
  if (!existing) return null;

  const now = Date.now();
  const merged: Note = {
    ...existing,
    ...updates,
    excerpt: updates.content !== undefined ? makeExcerpt(updates.content) : existing.excerpt,
    updatedAt: now,
    version: existing.version + 1,
    syncStatus: 'pending',
  };

  await db.runAsync(
    `UPDATE notes SET title = ?, content = ?, excerpt = ?, notebook_id = ?, is_pinned = ?, is_locked = ?, updated_at = ?, version = ?, sync_status = ?
     WHERE id = ?`,
    [merged.title, merged.content, merged.excerpt, merged.notebookId,
     merged.isPinned ? 1 : 0, merged.isLocked ? 1 : 0,
     merged.updatedAt, merged.version, merged.syncStatus, id]
  );

  return merged;
}

// 切换置顶
export async function togglePin(id: string): Promise<void> {
  const db = await getDB();
  const note = await getNoteById(id);
  if (!note) return;
  await db.runAsync(
    `UPDATE notes SET is_pinned = ?, updated_at = ?, version = ?, sync_status = 'pending' WHERE id = ?`,
    [note.isPinned ? 0 : 1, Date.now(), note.version + 1, id]
  );
}

// 软删除(移入回收站)
export async function softDeleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE notes SET is_deleted = 1, deleted_at = ?, updated_at = ?, version = version + 1, sync_status = 'pending' WHERE id = ?`,
    [Date.now(), Date.now(), id]
  );
}

// 恢复笔记
export async function restoreNote(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE notes SET is_deleted = 0, deleted_at = NULL, updated_at = ?, version = version + 1, sync_status = 'pending' WHERE id = ?`,
    [Date.now(), id]
  );
}

// 永久删除
export async function deleteNotePermanently(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

// 获取回收站笔记
export async function listTrashNotes(): Promise<Note[]> {
  const db = await getDB();
  const rows = await db.getAllAsync(
    'SELECT * FROM notes WHERE is_deleted = 1 ORDER BY deleted_at DESC'
  );
  return rows.map(rowToNote);
}

// 全文搜索
export async function searchNotes(keyword: string): Promise<Note[]> {
  const db = await getDB();
  const pattern = `%${keyword}%`;
  const rows = await db.getAllAsync(
    `SELECT * FROM notes
     WHERE is_deleted = 0 AND (title LIKE ? OR content LIKE ?)
     ORDER BY is_pinned DESC, updated_at DESC`,
    [pattern, pattern]
  );
  return rows.map(rowToNote);
}
