import { createContext } from 'react'
import type { AuthenticatedUser, LoginRequest, RegisterRequest } from '../types'

export interface AuthContextValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<AuthenticatedUser>
  register: (request: RegisterRequest) => Promise<AuthenticatedUser>
  logout: () => void
  refreshUser: () => Promise<AuthenticatedUser | null>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
