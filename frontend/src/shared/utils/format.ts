const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

const fecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatPrecio(valor: number): string {
  return moneda.format(valor)
}

export function formatFecha(iso: string): string {
  return fecha.format(new Date(iso))
}

/** Devuelve el primer error de un campo de TanStack Form, solo si el usuario ya lo tocó. */
export function fieldError(meta: { isTouched: boolean; errors: unknown[] }): string | undefined {
  if (!meta.isTouched || meta.errors.length === 0) return undefined
  const first = meta.errors[0]
  return typeof first === 'string' ? first : undefined
}
