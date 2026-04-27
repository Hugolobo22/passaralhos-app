import { create } from "zustand";
import { authService } from "../core/auth/authService";
import { tokenManager } from "../core/auth/tokenManager";
import type { User } from "../modules/auth/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ?? "Erro ao fazer login. Tente novamente.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.register(name, email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ?? "Erro ao criar conta. Tente novamente.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const hasTokens = await tokenManager.hasTokens();
      if (!hasTokens) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenManager.clearTokens();
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
