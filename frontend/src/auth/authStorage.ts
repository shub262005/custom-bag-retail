const AUTH_TOKEN_KEY = 'auth_token'

export const getStoredToken = (): string | null => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim()
  return token || null
}

export const storeToken = (token: string): void => {
  const normalizedToken = token.trim()
  if (!normalizedToken) {
    throw new Error('Cannot store an empty access token')
  }
  localStorage.setItem(AUTH_TOKEN_KEY, normalizedToken)
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'
