import type { EstadoPedido } from '../../features/pedidos/types'

const estilos: Record<EstadoPedido, { clase: string; texto: string }> = {
  PENDIENTE: { clase: 'bg-amber-100 text-amber-800 ring-amber-200', texto: 'Pendiente' },
  EN_PREPARACION: { clase: 'bg-sky-100 text-sky-800 ring-sky-200', texto: 'En preparación' },
  ENTREGADO: { clase: 'bg-emerald-100 text-emerald-800 ring-emerald-200', texto: 'Entregado' },
  CANCELADO: { clase: 'bg-stone-200 text-stone-700 ring-stone-300', texto: 'Cancelado' },
}

export function etiquetaEstado(estado: EstadoPedido): string {
  return estilos[estado].texto
}

export function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const { clase, texto } = estilos[estado]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${clase}`}>
      {texto}
    </span>
  )
}
