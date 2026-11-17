import type { AppData } from '../types';

const KEY = 'insight-agent:data:v1';

/** Persistência local demonstrativa. Pode ser trocada por uma API REST no futuro. */
export const storage = {
  load(): AppData | null {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppData;
      return parsed && parsed.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  },
  save(data: AppData) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ambiente sem storage */
    }
  },
};
