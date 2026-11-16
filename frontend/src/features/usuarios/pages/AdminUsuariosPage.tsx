import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { UserPublic } from '../types'

export function AdminUsuariosPage() {
  const actual = useAuthStore((s) => s.usuario)
  const usuarios = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<number | null>(null)

  const columns = useMemo<ColumnDef<UserPublic>[]>(() => {
    const ejecutar = async (id: number, accion: (id: number) => Promise<unknown>) => {
      setError(null)
      setProcesando(id)
      try {
        await accion(id)
      } catch (e) {
        setError(handleApiError(e))
      } finally {
        setProcesando(null)
      }
    }

    return [
      { accessorKey: 'username', header: 'Usuario', cell: ({ row }) => <span className="font-medium">{row.original.username}</span> },
      { accessorKey: 'full_name', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) =>
          row.original.role === 'admin' ? (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">admin</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">user</span>
          ),
      },
      {
        id: 'estado',
        accessorFn: (u) => (u.disabled ? 'Inactivo' : 'Activo'),
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="text-red-600">Inactivo</span>
          ) : (
            <span className="text-emerald-700">Activo</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          // No se ofrece desactivar al usuario de la sesión.
          if (u.id === actual?.id) return <span className="text-xs text-stone-400">(vos)</span>
          return u.disabled ? (
            <Button size="sm" variant="secondary" loading={procesando === u.id} onClick={() => void ejecutar(u.id, activar.mutateAsync)}>
              Activar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              loading={procesando === u.id}
              onClick={() => void ejecutar(u.id, desactivar.mutateAsync)}
            >
              Desactivar
            </Button>
          )
        },
      },
    ]
  }, [actual?.id, activar.mutateAsync, desactivar.mutateAsync, procesando])

  return (
    <div>
      <PageHeader titulo="Usuarios" subtitulo="Activá o desactivá cuentas. Una cuenta desactivada no puede iniciar sesión." />
      <div className="mb-4">
        <AlertaError mensaje={error} />
      </div>
      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError error={usuarios.error} onRetry={() => void usuarios.refetch()} />
      ) : (
        <DataTable data={usuarios.data} columns={columns} buscador vacio="No hay usuarios" />
      )}
    </div>
  )
}
