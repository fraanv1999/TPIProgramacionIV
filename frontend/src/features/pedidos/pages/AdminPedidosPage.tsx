import { useCallback, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { etiquetaEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Select } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { formatPrecio } from '../../../shared/utils/format'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { PedidosTable } from '../components/PedidosTable'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import type { EstadoPedido, Pedido } from '../types'
import { ESTADOS_PEDIDO } from '../types'

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined)
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // El panel pide limit=100 y la tabla pagina del lado del cliente.
  const pedidos = usePedidos({ skip: 0, limit: 100, estado })
  const cambiarEstado = useCambiarEstadoPedido()
  const { mutateAsync } = cambiarEstado

  const aplicar = useCallback(
    async (pedido: Pedido, destino: EstadoPedido) => {
      setError(null)
      setProcesandoId(pedido.id)
      try {
        await mutateAsync({ id: pedido.id, estado: destino })
        setACancelar(null)
      } catch (e) {
        setError(handleApiError(e))
      } finally {
        setProcesandoId(null)
      }
    },
    [mutateAsync],
  )

  const onCambiarEstado = useCallback(
    (pedido: Pedido, destino: EstadoPedido) => {
      // Cancelar restituye stock: se pide confirmación.
      if (destino === 'CANCELADO') {
        setError(null)
        setACancelar(pedido)
      } else {
        void aplicar(pedido, destino)
      }
    },
    [aplicar],
  )

  const onVer = useCallback((p: Pedido) => setSeleccionado(p), [])

  return (
    <div>
      <PageHeader titulo="Pedidos" subtitulo="Avanzá o cancelá pedidos según la máquina de estados.">
        <div className="w-56">
          <Select
            aria-label="Filtrar por estado"
            value={estado ?? ''}
            onChange={(e) => setEstado(e.target.value ? (e.target.value as EstadoPedido) : undefined)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {etiquetaEstado(e)}
              </option>
            ))}
          </Select>
        </div>
      </PageHeader>

      {!aCancelar && (
        <div className="mb-4">
          <AlertaError mensaje={error} />
        </div>
      )}

      {pedidos.isPending ? (
        <SkeletonFilas filas={6} />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onRetry={() => void pedidos.refetch()} />
      ) : (
        <PedidosTable
          pedidos={pedidos.data.items}
          onVer={onVer}
          onCambiarEstado={onCambiarEstado}
          procesandoId={procesandoId}
        />
      )}

      <Modal open={!!seleccionado} title={`Pedido #${seleccionado?.id ?? ''}`} onClose={() => setSeleccionado(null)} size="lg">
        {seleccionado && <PedidoDetalle pedido={seleccionado} />}
      </Modal>

      <Modal open={!!aCancelar} title="Cancelar pedido" onClose={() => setACancelar(null)}>
        {aCancelar && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-stone-600">
              ¿Cancelar el pedido <strong>#{aCancelar.id}</strong> ({formatPrecio(aCancelar.total)})? Se restituirá el stock
              de sus productos.
            </p>
            <AlertaError mensaje={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setACancelar(null)}>
                Volver
              </Button>
              <Button
                variant="danger"
                loading={procesandoId === aCancelar.id}
                onClick={() => void aplicar(aCancelar, 'CANCELADO')}
              >
                Cancelar pedido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
