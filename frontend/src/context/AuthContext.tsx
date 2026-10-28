import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from '../auth/authStorage'
import type { AuthenticatedUser, LoginRequest, RegisterRequest } from '../types'
import { AuthContext, type AuthContextValue } from './authContextDefinition'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    clearStoredToken()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const refreshUser = useCallback(async (): Promise<AuthenticatedUser | null> => {
    if (!getStoredToken()) {
      setUser(null)
      return null
    }

    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
      return currentUser
    } catch (err: unknown) {
      // Only clear the session for authentication failures (401/403).
      // Network errors (backend offline / ECONNREFUSED) should NOT wipe the
      // local session — the user is still "logged in"; the server is just
      // temporarily unreachable. Clearing the session would also wipe the
      // entire React Query cache, making every data panel show zeros.
      const status =
        err != null &&
          typeof err === 'object' &&
          'response' in err &&
          err.response != null &&
          typeof err.response === 'object' &&
          'status' in err.response
          ? (err.response as { status: number }).status
          : null

      if (status === 401 || status === 403) {
        clearSession()
        return null
      }

      // Backend unreachable — preserve stored token; ProtectedRoute will
      // redirect to login. Return null so callers know the user is unresolved.
      return null
    }
  }, [clearSession])

  useEffect(() => {
    let active = true

    const initialize = async () => {
      await refreshUser()
      if (active) setIsLoading(false)
    }

    void initialize()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only — refreshUser is stable via clearSession dep

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (request: LoginRequest): Promise<AuthenticatedUser> => {
    const response = await authApi.login(request)
    storeToken(response.token)
    setUser(response.user)
    return response.user
  }, [])

  const register = useCallback((request: RegisterRequest) => authApi.register(request), [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user && getStoredToken()),
    isLoading,
    login,
    register,
    logout: clearSession,
    refreshUser,
  }), [user, isLoading, login, register, clearSession, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
