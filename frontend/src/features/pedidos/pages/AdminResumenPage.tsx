import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { formatPrecio } from '../../../shared/utils/format'
import { ResumenCard } from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const resumen = useResumenPedidos()

  return (
    <div>
      <PageHeader titulo="Resumen del negocio" subtitulo="Indicadores de pedidos en tiempo real.">
        <Button variant="secondary" loading={resumen.isFetching} onClick={() => void resumen.refetch()}>
          Actualizar
        </Button>
      </PageHeader>

      {resumen.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : resumen.isError ? (
        <EstadoError error={resumen.error} onRetry={() => void resumen.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard titulo="Ingresos (entregados)" valor={formatPrecio(resumen.data.ingresos_entregados)} icono="💰" acento="bg-emerald-100" />
          <ResumenCard titulo="Pedidos de hoy" valor={String(resumen.data.pedidos_hoy)} icono="📅" acento="bg-brand-100" />
          <ResumenCard titulo="Pendientes" valor={String(resumen.data.pendientes)} icono="⏳" acento="bg-amber-100" />
          <ResumenCard titulo="En preparación" valor={String(resumen.data.en_preparacion)} icono="👨‍🍳" acento="bg-sky-100" />
          <ResumenCard titulo="Entregados" valor={String(resumen.data.entregados)} icono="✅" acento="bg-emerald-100" />
          <ResumenCard titulo="Cancelados" valor={String(resumen.data.cancelados)} icono="✖️" acento="bg-stone-200" />
        </div>
      )}
    </div>
  )
}
