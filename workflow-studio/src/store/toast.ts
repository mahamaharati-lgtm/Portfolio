import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  /** Text for the polite screen-reader live region (not visually duplicated). */
  announcement: string;
  push: (message: string, tone?: ToastTone) => void;
  announce: (message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  announcement: '',
  push: (message, tone = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, tone, message }] }));
    setTimeout(() => get().dismiss(id), tone === 'error' ? 8000 : 5000);
  },
  announce: (message) => {
    // Clearing first makes repeated identical messages announce again.
    set({ announcement: '' });
    setTimeout(() => set({ announcement: message }), 50);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToasts.getState().push(m, 'success'),
  error: (m: string) => useToasts.getState().push(m, 'error'),
  info: (m: string) => useToasts.getState().push(m, 'info'),
  announce: (m: string) => useToasts.getState().announce(m),
};
