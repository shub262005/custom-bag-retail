export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'CASHIER' | 'CUSTOMER'

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: AuthenticatedUser
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}
