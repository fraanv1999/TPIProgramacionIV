import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerResumen,
} from '../api/pedidos'
import type { EstadoPedido, PedidoCreate, PedidoFiltros } from '../types'

export const pedidosKeys = {
  all: ['pedidos'] as const,
  list: (filtros: PedidoFiltros) => ['pedidos', 'lista', filtros] as const,
  resumen: ['pedidos', 'resumen'] as const,
}

export function usePedidos(filtros: PedidoFiltros) {
  return useQuery({
    queryKey: pedidosKeys.list(filtros),
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: pedidosKeys.resumen, queryFn: obtenerResumen })
}

/** Crear o cancelar un pedido cambia el stock: se invalidan pedidos (incluido el resumen) y productos. */
function useInvalidarPedidosYStock() {
  const qc = useQueryClient()
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: pedidosKeys.all }),
      qc.invalidateQueries({ queryKey: ['productos'] }),
    ])
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (payload: PedidoCreate) => crearPedido(payload),
    onSuccess: invalidar,
  })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, estado),
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: invalidar,
  })
}
