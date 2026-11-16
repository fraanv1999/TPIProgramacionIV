import { Link } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <EstadoVacio
        icono="🔒"
        titulo="No tenés permiso para ver esta página"
        mensaje="Esta sección está reservada para otro rol. Si creés que es un error, contactá al administrador."
        accion={
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </div>
  )
}
