export type Rol = 'user' | 'admin'

/** Espejo de UserPublic del backend (nunca incluye la contraseña). */
export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

export interface UserCreate {
  username: string
  full_name: string
  email: string
  password: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface MessageResponse {
  message: string
}
