import { create } from 'zustand';
import type { Note, NoteInput, NoteUpdate, Notebook } from '@/types';
import * as noteDao from '@/db/noteDao';
import * as notebookDao from '@/db/notebookDao';

interface NoteState {
  notes: Note[];
  notebooks: Notebook[];
  currentNote: Note | null;
  isLoading: boolean;
  selectedNotebookId: string | null;

  // 笔记操作
  loadNotes: (notebookId?: string | null) => Promise<void>;
  loadNote: (id: string) => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (keyword: string) => Promise<Note[]>;

  // 笔记本操作
  loadNotebooks: () => Promise<void>;
  createNotebook: (name: string, icon?: string, color?: string) => Promise<Notebook>;
  deleteNotebook: (id: string) => Promise<void>;
  selectNotebook: (id: string | null) => void;

  setCurrentNote: (note: Note | null) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  notebooks: [],
  currentNote: null,
  isLoading: false,
  selectedNotebookId: null,

  loadNotes: async (notebookId) => {
    set({ isLoading: true });
    const notes = await noteDao.listNotes(notebookId);
    set({ notes, isLoading: false });
  },

  loadNote: async (id) => {
    const note = await noteDao.getNoteById(id);
    set({ currentNote: note });
  },

  createNote: async (input) => {
    const note = await noteDao.createNote(input);
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id, updates) => {
    const updated = await noteDao.updateNote(id, updates);
    if (updated) {
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        currentNote: state.currentNote?.id === id ? updated : state.currentNote,
      }));
    }
  },

  togglePin: async (id) => {
    await noteDao.togglePin(id);
    await get().loadNotes(get().selectedNotebookId);
  },

  deleteNote: async (id) => {
    await noteDao.softDeleteNote(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  searchNotes: async (keyword) => {
    return await noteDao.searchNotes(keyword);
  },

  loadNotebooks: async () => {
    const notebooks = await notebookDao.listNotebooks();
    set({ notebooks });
  },

  createNotebook: async (name, icon, color) => {
    const nb = await notebookDao.createNotebook(name, icon, color);
    set((state) => ({ notebooks: [...state.notebooks, nb] }));
    return nb;
  },

  deleteNotebook: async (id) => {
    await notebookDao.deleteNotebook(id);
    set((state) => ({ notebooks: state.notebooks.filter((n) => n.id !== id) }));
  },

  selectNotebook: (id) => {
    set({ selectedNotebookId: id });
    get().loadNotes(id);
  },

  setCurrentNote: (note) => set({ currentNote: note }),
}));
