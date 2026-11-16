import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Rol } from '../features/auth/types'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  /** Roles permitidos. Sin roles: alcanza con tener sesión. */
  roles?: Rol[]
}

/**
 * Protege rutas en el frontend. Es solo UX: la protección real está en el backend
 * (get_current_active_user y require_role).
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Verificando sesión">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
