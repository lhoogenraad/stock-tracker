import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: number | null;
  setAuth: (token: string, userId: number) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  userId: null,
  setAuth: (token, userId) => {
    localStorage.setItem('token', token);
    set({ token, userId });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ token: null, userId: null });
  },
}));
