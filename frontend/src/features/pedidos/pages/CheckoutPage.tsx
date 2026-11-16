import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/format'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm } from '../components/CheckoutForm'
import type { CheckoutValores } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  // Sin ítems no hay nada que confirmar (salvo que se acabe de confirmar y se esté redirigiendo).
  if (items.length === 0 && !confirmado) return <Navigate to="/carrito" replace />

  const handleSubmit = async (valores: CheckoutValores) => {
    setError(null)
    try {
      await crearPedido.mutateAsync({
        ...valores,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      })
      setConfirmado(true)
      vaciar()
      navigate('/mis-pedidos', { replace: true, state: { creado: true } })
    } catch (e) {
      setError(handleApiError(e, 'No se pudo crear el pedido'))
    }
  }

  return (
    <div>
      <PageHeader titulo="Confirmar pedido" subtitulo="Indicá dónde lo entregamos y cómo vas a pagar." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <CheckoutForm onSubmit={handleSubmit} error={error} />
        </Card>
        <Card className="h-fit p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tu pedido</h2>
            <Link to="/carrito" className="text-sm text-brand-700 hover:underline">
              Editar
            </Link>
          </div>
          <ul className="divide-y divide-stone-100 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-3 py-2">
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="whitespace-nowrap">{formatPrecio(i.precio_unitario * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrecio(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
