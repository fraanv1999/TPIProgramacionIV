import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarProducto,
  actualizarStock,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from '../api/productos'
import type { ProductoCreate, ProductoFiltros, ProductoStockUpdate, ProductoUpdate } from '../types'

export const productosKeys = {
  all: ['productos'] as const,
  list: (filtros: ProductoFiltros) => ['productos', filtros] as const,
}

export function useProductos(filtros: ProductoFiltros) {
  return useQuery({
    queryKey: productosKeys.list(filtros),
    queryFn: () => listarProductos(filtros),
    // Mantiene la página anterior visible mientras llega la siguiente.
    placeholderData: keepPreviousData,
  })
}

function useInvalidarProductos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: productosKeys.all })
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (payload: ProductoCreate) => crearProducto(payload),
    onSuccess: invalidar,
  })
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoUpdate }) => actualizarProducto(id, payload),
    onSuccess: invalidar,
  })
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoStockUpdate }) => actualizarStock(id, payload),
    onSuccess: invalidar,
  })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (id: number) => eliminarProducto(id),
    onSuccess: invalidar,
  })
}
