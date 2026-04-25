import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        // Also set in localStorage for api interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('dev_token', token);
        }
        set({ token, user });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dev_token');
        }
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'campus-ai-auth',
    }
  )
);
