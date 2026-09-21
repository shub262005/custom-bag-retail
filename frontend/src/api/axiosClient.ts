import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Shared Axios client for the Inventory Management System.
 * 
 * - Base URL is set to '/api/v1', which is proxied by Vite to http://localhost:8080 during development.
 * - Future Spring Security JWT authentication can be integrated via the request interceptor below.
 * - Does NOT implement fake users, fake login, or fake roles.
 */
export const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Placeholder request interceptor for future authentication
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // When Spring Security is introduced in the backend, retrieve the bearer token:
    // const token = localStorage.getItem('auth_token')
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
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
    // Pass the rejection through so TanStack Query or call sites can handle it
    return Promise.reject(error)
  }
)

export default axiosClient
