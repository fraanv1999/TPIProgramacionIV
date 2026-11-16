import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import type { Pedido } from '../types'

const FORMA_PAGO_TEXTO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

/** Detalle de un pedido con sus líneas (copias inmutables de nombre y precio). */
export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-stone-500">Estado</dt>
        <dd>
          <BadgeEstado estado={pedido.estado} />
        </dd>
        <dt className="text-stone-500">Creado</dt>
        <dd>{formatFecha(pedido.created_at)}</dd>
        <dt className="text-stone-500">Última actualización</dt>
        <dd>{formatFecha(pedido.updated_at)}</dd>
        <dt className="text-stone-500">Forma de pago</dt>
        <dd>{FORMA_PAGO_TEXTO[pedido.forma_pago]}</dd>
        <dt className="text-stone-500">Dirección de entrega</dt>
        <dd className="break-words">{pedido.direccion_entrega}</dd>
        {pedido.notas && (
          <>
            <dt className="text-stone-500">Notas</dt>
            <dd className="break-words">{pedido.notas}</dd>
          </>
        )}
      </dl>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Cant.</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pedido.items.map((item) => (
              <tr key={item.producto_id}>
                <td className="px-3 py-2">{item.nombre_producto}</td>
                <td className="px-3 py-2 text-right">{formatPrecio(item.precio_unitario)}</td>
                <td className="px-3 py-2 text-right">{item.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatPrecio(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-stone-200 font-semibold">
              <td className="px-3 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-right">{formatPrecio(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
