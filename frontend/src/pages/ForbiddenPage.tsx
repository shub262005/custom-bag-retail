import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth()
  const home = user?.role === 'CUSTOMER' ? '/custom-bag' : '/dashboard'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-amber-50 p-4 text-amber-600">
        <ShieldX className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Access denied</h2>
      <p className="mt-1 mb-6 max-w-sm text-xs text-slate-500">
        Your {user?.role.replaceAll('_', ' ').toLowerCase()} account does not have permission to view this page.
      </p>
      <Link to={home}>
        <Button variant="primary">Return to your home page</Button>
      </Link>
    </div>
  )
}
