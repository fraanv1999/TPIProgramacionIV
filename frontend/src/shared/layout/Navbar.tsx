import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  }`

const ADMIN_LINKS = [
  { to: '/admin/resumen', label: 'Resumen' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/usuarios', label: 'Usuarios' },
]

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0))
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)

  const handleLogout = async () => {
    setSaliendo(true)
    try {
      await logout()
    } finally {
      setSaliendo(false)
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
        <Link to="/" className="mr-2 flex items-center gap-2 text-lg font-bold text-brand-700">
          <span aria-hidden="true">🍔</span> Food Store
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Catálogo
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={linkClass}>
              Mis pedidos
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NavLink to="/carrito" className={linkClass} aria-label={`Carrito, ${cantidad} productos`}>
            🛒 Carrito
            {cantidad > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">
                {cantidad}
              </span>
            )}
          </NavLink>

          {usuario ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{usuario.full_name}</p>
                <p className="text-xs leading-tight text-stone-500">
                  {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={saliendo}
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Ingresar
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

      {/* El panel solo se muestra al admin. La protección real está en el backend (require_role). */}
      {usuario?.role === 'admin' && (
        <div className="border-t border-stone-100 bg-stone-50">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-1" aria-label="Panel de administración">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Admin</span>
            {ADMIN_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
