// 笔记数据模型
export interface Note {
  id: string;
  title: string;
  content: string;        // HTML 富文本
  excerpt: string;        // 摘要
  notebookId: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  isLocked: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  serverUpdatedAt: number | null;
}

// 笔记本
export interface Notebook {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  sortOrder: number;
  noteCount: number;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  serverUpdatedAt: number | null;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: string;
  noteCount: number;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  serverUpdatedAt: number | null;
}

// 笔记-标签关联
export interface NoteTag {
  noteId: string;
  tagId: string;
  createdAt: number;
}

// 创建笔记的输入
export interface NoteInput {
  title?: string;
  content?: string;
  notebookId?: string | null;
}

// 更新笔记的输入
export interface NoteUpdate {
  title?: string;
  content?: string;
  notebookId?: string | null;
  isPinned?: boolean;
  isLocked?: boolean;
}
