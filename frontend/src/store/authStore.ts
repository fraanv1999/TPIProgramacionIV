import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getMe, loginRequest, logoutRequest } from '../features/auth/api/auth'
import type { UserPublic } from '../features/auth/types'
import { registerSessionExpiredHandler } from '../shared/api/axiosInstance'
import { queryClient } from '../shared/api/queryClient'

interface AuthState {
  usuario: UserPublic | null
  /** true mientras checkSession confirma la sesión con el backend. */
  cargando: boolean
  login: (username: string, password: string) => Promise<UserPublic>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await loginRequest({ username, password })
        const usuario = await getMe()
        queryClient.clear()
        set({ usuario, cargando: false })
        return usuario
      },

      logout: async () => {
        try {
          await logoutRequest()
        } finally {
          queryClient.clear()
          set({ usuario: null, cargando: false })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          const usuario = await getMe()
          set({ usuario, cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      clearSession: () => {
        queryClient.clear()
        set({ usuario: null, cargando: false })
      },
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo se persiste el usuario (datos públicos). Nunca el token: vive en la cookie HttpOnly.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

registerSessionExpiredHandler(() => useAuthStore.getState().clearSession())
