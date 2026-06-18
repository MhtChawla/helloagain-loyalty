import { create } from 'zustand';
import { storage } from '../../lib/storage';
import type { AppUser } from '../../api/types';

interface AuthState {
  token: string | null;
  user: AppUser | null;
  hydrated: boolean;
  setToken: (token: string) => Promise<void>;
  setUser: (user: AppUser) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setToken: async (token) => {
    await storage.setToken(token);
    set({ token });
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    set({ token: null, user: null });
    storage.deleteToken();
  },

  hydrate: async () => {
    const token = await storage.getToken();
    set({ token: token ?? null, hydrated: true });
  },
}));
