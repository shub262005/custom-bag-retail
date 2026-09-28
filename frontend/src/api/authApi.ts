import { axiosClient } from './axiosClient'
import type {
  AuthenticatedUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types'

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>('/auth/login', request)
    return response.data
  },

  async register(request: RegisterRequest): Promise<AuthenticatedUser> {
    const response = await axiosClient.post<AuthenticatedUser>('/auth/register', request)
    return response.data
  },

  async me(): Promise<AuthenticatedUser> {
    const response = await axiosClient.get<AuthenticatedUser>('/auth/me')
    return response.data
  },
}
