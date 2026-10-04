import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { AUTH_UNAUTHORIZED_EVENT, getStoredToken } from '../auth/authStorage'

/**
 * Shared Axios client for the Inventory Management System.
 * 
 * - Base URL is set to '/api/v1', which is proxied by Vite to http://localhost:8080 during development.
 * - Attaches the persisted Spring Security JWT when one is available.
 * - Does NOT implement fake users, fake login, or fake roles.
 */
export const axiosClient = axios.create({
  baseURL: '/api/v1',
  // Axios selects JSON for object bodies; the browser supplies the boundary for FormData.
  timeout: 15000,
})

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for consistent error propagation
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getStoredToken()) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  }
)

export default axiosClient
