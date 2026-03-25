import { defineStore } from 'pinia';
import type { AdminInfo } from '@/api/types';

interface AuthState {
  user: AdminInfo | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'auth-store';

// 从 localStorage 加载状态
function loadState(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

// 保存状态到 localStorage
function saveState(state: AuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }));
  } catch {
    // ignore
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => loadState(),

  getters: {
    getUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    setUser(user: AdminInfo | null) {
      this.user = user;
      this.isAuthenticated = !!user;
      saveState(this.$state);
    },

    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
      saveState(this.$state);
    },
  },
});