import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activarUsuario, desactivarUsuario, listarUsuarios } from '../api/usuarios'

export const usuariosKeys = {
  all: ['usuarios'] as const,
}

export function useUsuarios() {
  return useQuery({ queryKey: usuariosKeys.all, queryFn: listarUsuarios })
}

export function useActivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKeys.all }),
  })
}

export function useDesactivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => desactivarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKeys.all }),
  })
}
