import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types'

export const categoriasKeys = {
  all: ['categorias'] as const,
}

export function useCategorias() {
  return useQuery({ queryKey: categoriasKeys.all, queryFn: listarCategorias })
}

export function useCrearCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaCreate) => crearCategoria(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKeys.all }),
  })
}

export function useActualizarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaUpdate }) => actualizarCategoria(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoriasKeys.all })
      // Los productos muestran el nombre de su categoría.
      void qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useEliminarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKeys.all }),
  })
}
