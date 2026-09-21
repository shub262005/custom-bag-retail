import { AxiosError } from 'axios'

export interface BackendErrorResponse {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  validationErrors?: Record<string, string>
}

/**
 * Extracts a clean, human-readable error message from Axios errors or backend ErrorResponse.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<BackendErrorResponse>
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message
    }
    if (axiosErr.response?.data?.error) {
      return `${axiosErr.response.data.error} (${axiosErr.response.status})`
    }
    if (axiosErr.message) {
      return axiosErr.message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Extracts field-specific validation errors from backend ErrorResponse if present.
 */
export function getValidationErrors(error: unknown): Record<string, string> | undefined {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<BackendErrorResponse>
    return axiosErr.response?.data?.validationErrors
  }
  return undefined
}
