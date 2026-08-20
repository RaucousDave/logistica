import { create } from 'zustand';
import { User, AuthTokens } from '@/types/api';
import { apiFetch } from '@/lib/api-client';

interface AuthStore {
  // Session State
  user: User | null;
  tokens: AuthTokens | null;
  isSignedIn: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (user: Partial<User>) => void;
  toggleDriverAvailability: (isAvailable: boolean) => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isSignedIn: false,
  isLoading: false,

  setAuth: (user, tokens) =>
    set({
      user,
      tokens,
      isSignedIn: true,
      isLoading: false,
    }),

  updateUser: (partialUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    })),

  toggleDriverAvailability: async (is_available: boolean) => {
    const token = get().tokens?.access;
    if (!token) throw new Error('Not authenticated');

    const updatedUser = await apiFetch<User>('api/auth/driver/availability/', {
      method: 'POST',
      token,
      body: JSON.stringify({ is_available }),
    });

    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
    }));

    return updatedUser;
  },

  logout: () =>
    set({
      user: null,
      tokens: null,
      isSignedIn: false,
      isLoading: false,
    }),
}));
