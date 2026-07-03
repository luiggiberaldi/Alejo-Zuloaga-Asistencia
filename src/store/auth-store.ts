import { create } from 'zustand';

import type { AuthUser, Role } from '@/modules/auth/types';

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  setSession: (user: AuthUser | null, role: Role | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  setSession: (user, role) => set({ user, role, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, role: null, loading: false }),
}));
