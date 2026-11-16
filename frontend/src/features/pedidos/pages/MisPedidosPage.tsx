import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types'

const LIMIT = 10

export function MisPedidosPage() {
  const location = useLocation()
  const recienCreado = (location.state as { creado?: boolean } | null)?.creado === true
  const [pagina, setPagina] = useState(0)
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pedidos = usePedidos({ skip: pagina * LIMIT, limit: LIMIT })
  const cancelar = useCancelarPedido()

  const confirmarCancelacion = async () => {
    if (!aCancelar) return
    setError(null)
    try {
      await cancelar.mutateAsync(aCancelar.id)
      setACancelar(null)
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const totalPaginas = pedidos.data ? Math.ceil(pedidos.data.total / LIMIT) : 0

  return (
    <div>
      <PageHeader titulo="Mis pedidos" subtitulo="Seguí el estado de tus pedidos." />

      {recienCreado && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ¡Pedido confirmado! Te avisaremos cuando esté en preparación.
        </p>
      )}

      {pedidos.isPending ? (
        <SkeletonFilas filas={4} />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onRetry={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🧾"
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/" className="font-medium text-brand-700 hover:underline">
              Ver el catálogo
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pedidos.data.items.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Pedido #{p.id}</span>
                  <BadgeEstado estado={p.estado} />
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {formatFecha(p.created_at)} · {p.items.reduce((a, i) => a + i.cantidad, 0)} producto(s)
                </p>
              </div>
              <p className="text-lg font-bold">{formatPrecio(p.total)}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setSeleccionado(p)}>
                  Ver detalle
                </Button>
                {p.estado === 'PENDIENTE' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => {
                      setError(null)
                      setACancelar(p)
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          ))}
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} total={pedidos.data.total} />
        </div>
      )}

      <Modal open={!!seleccionado} title={`Pedido #${seleccionado?.id ?? ''}`} onClose={() => setSeleccionado(null)} size="lg">
        {seleccionado && <PedidoDetalle pedido={seleccionado} />}
      </Modal>

      <Modal open={!!aCancelar} title="Cancelar pedido" onClose={() => setACancelar(null)}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-stone-600">
            ¿Cancelar el pedido <strong>#{aCancelar?.id}</strong> por {formatPrecio(aCancelar?.total ?? 0)}? Esta acción no se
            puede deshacer.
          </p>
          <AlertaError mensaje={error} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setACancelar(null)}>
              Volver
            </Button>
            <Button variant="danger" loading={cancelar.isPending} onClick={() => void confirmarCancelacion()}>
              Cancelar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
