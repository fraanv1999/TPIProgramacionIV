import axios, { AxiosError } from 'axios'

export const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

/** Rutas cuyo 401 es esperable y NO debe cerrar la sesión (login fallido, chequeo inicial). */
const RUTAS_SIN_INTERCEPCION = ['/auth/token', '/auth/me']

type SessionExpiredHandler = () => void
let onSessionExpired: SessionExpiredHandler | null = null

/** El authStore registra aquí cómo limpiar la sesión (evita la dependencia circular). */
export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // La cookie HttpOnly con el JWT viaja sola en cada petición: el frontend nunca lee el token.
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response) {
      const { status, data } = error.response
      const url = error.config?.url ?? ''
      const detail = (data as { detail?: unknown } | undefined)?.detail
      const es401 = status === 401 && !RUTAS_SIN_INTERCEPCION.some((r) => url.includes(r))
      const desactivada = status === 400 && detail === CUENTA_DESACTIVADA
      if (es401 || desactivada) {
        // Limpia el authStore; ProtectedRoute, al quedar sin usuario, redirige a /login.
        onSessionExpired?.()
      }
    }
    return Promise.reject(error)
  },
)
