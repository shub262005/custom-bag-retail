import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { AuthPageLayout } from '../components/auth/AuthPageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { getErrorMessage, getValidationErrors } from '../api/errorParser'
import { useAuth } from '../hooks/useAuth'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export const RegisterPage: React.FC = () => {
  const { register, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: { pathname?: string } } | null
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'CUSTOMER' ? '/home' : '/dashboard', { replace: true })
    }
  }, [isLoading, user, navigate])

  const setField = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof RegisterForm, string>> = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (!form.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address'
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRequestError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      navigate('/login', {
        replace: true,
        state: { registrationMessage: 'Account created successfully. Sign in to continue.', from: state?.from },
      })
    } catch (error) {
      const backendErrors = getValidationErrors(error)
      if (backendErrors) setErrors((current) => ({ ...current, ...backendErrors }))
      setRequestError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      title="Create customer account"
      description="Register to design a custom bag and track your requests."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
      footerLinkState={{ from: state?.from }}
    >
      {requestError && <div className="mb-4"><ErrorAlert title="Unable to register" message={requestError} /></div>}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Name" autoComplete="name" value={form.name} onChange={(event) => setField('name', event.target.value)} error={errors.name} leftIcon={<UserRound className="w-4 h-4" />} required />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(event) => setField('email', event.target.value)} error={errors.email} leftIcon={<Mail className="w-4 h-4" />} required />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setField('password', event.target.value)} error={errors.password} helperText="Use at least 8 characters." leftIcon={<LockKeyhole className="w-4 h-4" />} required />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setField('confirmPassword', event.target.value)} error={errors.confirmPassword} leftIcon={<LockKeyhole className="w-4 h-4" />} required />
        <Button type="submit" className="w-full" isLoading={submitting}>Create account</Button>
      </form>
    </AuthPageLayout>
  )
}
