import { v4 as uuidv4 } from 'uuid';
import { getDB } from './schema';
import type { Notebook } from '@/types';

function rowToNotebook(row: any): Notebook {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    noteCount: row.note_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    serverUpdatedAt: row.server_updated_at,
  };
}

export async function listNotebooks(): Promise<Notebook[]> {
  const db = await getDB();
  const rows = await db.getAllAsync(
    'SELECT * FROM notebooks ORDER BY sort_order ASC, created_at ASC'
  );
  return rows.map(rowToNotebook);
}

export async function createNotebook(name: string, icon = '📁', color = '#8E8E93'): Promise<Notebook> {
  const db = await getDB();
  const now = Date.now();
  const nb: Notebook = {
    id: uuidv4(),
    name,
    parentId: null,
    icon,
    color,
    sortOrder: 0,
    noteCount: 0,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    serverUpdatedAt: null,
  };

  await db.runAsync(
    `INSERT INTO notebooks (id, name, parent_id, icon, color, sort_order, note_count, created_at, updated_at, sync_status, server_updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [nb.id, nb.name, nb.icon, nb.color, nb.sortOrder, nb.noteCount, nb.createdAt, nb.updatedAt, nb.syncStatus]
  );

  return nb;
}

export async function deleteNotebook(id: string): Promise<void> {
  const db = await getDB();
  // 将该笔记本下的笔记移至未分类
  await db.runAsync('UPDATE notes SET notebook_id = NULL WHERE notebook_id = ?', [id]);
  await db.runAsync('DELETE FROM notebooks WHERE id = ?', [id]);
}
