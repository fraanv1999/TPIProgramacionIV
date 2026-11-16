import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { Input } from '../ui/Input'
import { Paginacion } from './Paginacion'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /** Muestra un buscador que filtra en todas las columnas (lado del cliente). */
  buscador?: boolean
  pageSize?: number
  vacio?: string
}

/** Tabla genérica con TanStack Table: orden, filtro y paginación del lado del cliente. */
export function DataTable<T>({ data, columns, buscador = false, pageSize = 10, vacio = 'Sin registros' }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      {buscador && (
        <div className="max-w-xs">
          <Input
            placeholder="Buscar en la tabla…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            aria-label="Buscar en la tabla"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-stone-800"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden="true">{dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-stone-500">
                  {vacio}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Paginacion
        pagina={table.getState().pagination.pageIndex}
        totalPaginas={table.getPageCount()}
        onChange={(p) => table.setPageIndex(p)}
        total={table.getFilteredRowModel().rows.length}
      />
    </div>
  )
}
