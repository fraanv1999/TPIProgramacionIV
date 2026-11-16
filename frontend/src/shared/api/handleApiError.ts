import { AxiosError } from 'axios'

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

/** Convierte el `detail` de un error de la API en un mensaje legible para la pantalla. */
export function handleApiError(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor'
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') {
      return detail
    }
    // 422: lista de errores de validación de FastAPI
    if (Array.isArray(detail)) {
      return (detail as ValidationIssue[])
        .map((d) => {
          const campo = d.loc?.filter((p) => p !== 'body').join('.')
          return campo ? `${campo}: ${d.msg ?? ''}` : (d.msg ?? '')
        })
        .join(' · ')
    }
    return fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
