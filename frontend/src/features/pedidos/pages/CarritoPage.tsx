import { Link, useNavigate } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/format'
import { useAuthStore } from '../../../store/authStore'
import { useCartStore } from '../../../store/cartStore'
import { ProductoImagen } from '../../productos/components/ProductoImagen'

export function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div>
        <PageHeader titulo="Carrito" />
        <EstadoVacio
          icono="🛒"
          titulo="Tu carrito está vacío"
          mensaje="Agregá productos desde el catálogo para armar tu pedido."
          accion={
            <Link to="/" className="font-medium text-brand-700 hover:underline">
              Ir al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader titulo="Carrito" subtitulo="Revisá tu pedido antes de confirmarlo.">
        <Button variant="ghost" onClick={vaciar}>
          Vaciar carrito
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.producto_id} className="flex flex-wrap items-center gap-4 p-4">
              <ProductoImagen src={item.imagen_url} alt={item.nombre} className="h-16 w-16 rounded-lg text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.nombre}</p>
                <p className="text-sm text-stone-500">{formatPrecio(item.precio_unitario)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Restar una unidad de ${item.nombre}`}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                >
                  −
                </Button>
                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  aria-label={`Cantidad de ${item.nombre}`}
                  value={item.cantidad}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (!Number.isNaN(v)) cambiarCantidad(item.producto_id, Math.floor(v))
                  }}
                  className="w-14 rounded-md border border-stone-300 px-2 py-1 text-center text-sm"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Sumar una unidad de ${item.nombre}`}
                  disabled={item.cantidad >= item.stock}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                >
                  +
                </Button>
              </div>
              <p className="w-28 text-right font-semibold">{formatPrecio(item.precio_unitario * item.cantidad)}</p>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => quitar(item.producto_id)}>
                Quitar
              </Button>
            </div>
          ))}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Productos</span>
            <span>{items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrecio(total)}</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">El precio final se confirma al crear el pedido.</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/checkout')}>
            {usuario ? 'Continuar al checkout' : 'Ingresar para confirmar'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
