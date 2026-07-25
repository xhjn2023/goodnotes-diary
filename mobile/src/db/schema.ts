import * as SQLite from 'expo-sqlite';

const DB_NAME = 'goodnotes.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// 获取数据库实例(单例)
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await initSchema(dbInstance);
  return dbInstance;
}

// 初始化表结构
async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- 笔记表
    CREATE TABLE IF NOT EXISTS notes (
      id                TEXT PRIMARY KEY,
      title             TEXT DEFAULT '',
      content           TEXT DEFAULT '',
      excerpt           TEXT DEFAULT '',
      notebook_id       TEXT,
      is_pinned         INTEGER DEFAULT 0,
      is_deleted        INTEGER DEFAULT 0,
      is_locked         INTEGER DEFAULT 0,
      created_at        INTEGER NOT NULL,
      updated_at        INTEGER NOT NULL,
      deleted_at        INTEGER,
      version           INTEGER DEFAULT 1,
      sync_status       TEXT DEFAULT 'pending',
      server_updated_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id);
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_sync ON notes(sync_status);
    CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned DESC, updated_at DESC);

    -- 笔记本表
    CREATE TABLE IF NOT EXISTS notebooks (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      parent_id    TEXT,
      icon         TEXT DEFAULT '📁',
      color        TEXT DEFAULT '#8E8E93',
      sort_order   INTEGER DEFAULT 0,
      note_count   INTEGER DEFAULT 0,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      sync_status  TEXT DEFAULT 'pending',
      server_updated_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_notebooks_parent ON notebooks(parent_id);

    -- 标签表
    CREATE TABLE IF NOT EXISTS tags (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL UNIQUE,
      color        TEXT DEFAULT '#8E8E93',
      note_count   INTEGER DEFAULT 0,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      sync_status  TEXT DEFAULT 'pending',
      server_updated_at INTEGER
    );

    -- 笔记-标签关联表
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id      TEXT NOT NULL,
      tag_id       TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);

    -- 同步状态表
    CREATE TABLE IF NOT EXISTS sync_state (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // 初始化默认笔记本(如果不存在)
  await db.runAsync(
    `INSERT OR IGNORE INTO notebooks (id, name, parent_id, icon, color, sort_order, note_count, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, 0, 0, ?, ?)`,
    ['nb_default', '未分类', '📦', '#8E8E93', Date.now(), Date.now()]
  );

  // 初始化同步状态
  await db.runAsync(
    `INSERT OR IGNORE INTO sync_state (key, value) VALUES ('last_sync_time', '0')`
  );
}
