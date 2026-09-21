import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export interface ErrorAlertProps {
  title?: string
  message: string
  validationErrors?: Record<string, string>
  onRetry?: () => void
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'An error occurred',
  message,
  validationErrors,
  onRetry,
}) => {
  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-left">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h5 className="text-sm font-semibold text-red-900">{title}</h5>
          <p className="text-xs text-red-700 mt-0.5">{message}</p>
          {validationErrors && Object.keys(validationErrors).length > 0 && (
            <ul className="mt-2 list-disc list-inside text-xs text-red-700 space-y-0.5">
              {Object.entries(validationErrors).map(([field, err]) => (
                <li key={field}>
                  <strong className="capitalize">{field}:</strong> {err}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3 h-3" />}
            className="border-red-300 text-red-700 hover:bg-red-100 shrink-0"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
