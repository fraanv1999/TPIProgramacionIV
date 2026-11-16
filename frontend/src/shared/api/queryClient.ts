import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // No reintentar errores del cliente (401, 403, 404...): solo fallas de red/servidor.
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response && error.response.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})
