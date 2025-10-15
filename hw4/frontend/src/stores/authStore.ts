import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, UserDTO, LoginResponse } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (response: LoginResponse) => {
        set({
          user: response.user,
          accessToken: response.accessToken,
          isAuthenticated: true
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false
        });
      },

      setUser: (user: UserDTO) => {
        set({ user });
      }
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);