import { useMutation } from '@tanstack/react-query'
import { registerRequest } from '../api/auth'
import type { UserCreate } from '../types'

export function useRegister() {
  return useMutation({
    mutationFn: (payload: UserCreate) => registerRequest(payload),
  })
}
