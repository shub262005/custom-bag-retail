import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { AuthPageLayout } from '../components/auth/AuthPageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { getErrorMessage } from '../api/errorParser'
import { useAuth } from '../hooks/useAuth'

interface LoginLocationState {
  from?: { pathname?: string }
  registrationMessage?: string
}

export const LoginPage: React.FC = () => {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'CUSTOMER' ? '/custom-bag' : '/dashboard', { replace: true })
    }
  }, [isLoading, user, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const authenticatedUser = await login({ email, password })
      const staffDestination = state?.from?.pathname || '/dashboard'
      navigate(authenticatedUser.role === 'CUSTOMER' ? '/custom-bag' : staffDestination, {
        replace: true,
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      title="Sign in"
      description="Access the retail system or continue to the Custom Bag Designer."
      footerText="New customer?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
    >
      {state?.registrationMessage && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          {state.registrationMessage}
        </div>
      )}
      {error && <div className="mb-4"><ErrorAlert title="Unable to sign in" message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leftIcon={<LockKeyhole className="w-4 h-4" />}
          required
        />
        <Button type="submit" className="w-full" isLoading={submitting} disabled={!email || !password}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-xs text-center text-slate-500">
        Customer registration creates a customer account only. Staff accounts are managed separately.
      </p>
    </AuthPageLayout>
  )
}
