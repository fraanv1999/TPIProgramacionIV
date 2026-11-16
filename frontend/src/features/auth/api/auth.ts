import { api } from '../../../shared/api/axiosInstance'
import type { LoginCredentials, MessageResponse, UserCreate, UserPublic } from '../types'

export async function loginRequest({ username, password }: LoginCredentials): Promise<MessageResponse> {
  // Formulario OAuth2 (application/x-www-form-urlencoded). El token llega en una cookie HttpOnly.
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await api.post<MessageResponse>('/auth/token', form)
  return data
}

export async function logoutRequest(): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/logout')
  return data
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me')
  return data
}

export async function registerRequest(payload: UserCreate): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/register', payload)
  return data
}
