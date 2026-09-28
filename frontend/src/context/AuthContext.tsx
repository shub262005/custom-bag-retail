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
    } catch {
      clearSession()
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
  }, [refreshUser])

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
