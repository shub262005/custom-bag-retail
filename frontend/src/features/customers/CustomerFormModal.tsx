import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useCreateCustomer, useUpdateCustomer } from './useCustomers'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import type { CustomerResponse, CustomerStatus } from '../../types'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: CustomerResponse | null
  onSuccess?: (saved: CustomerResponse) => void
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const toast = useToast()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const isEditing = Boolean(customer?.id)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<CustomerStatus>('ACTIVE')

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>()

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setName(customer.name || '')
        setPhone(customer.phone || '')
        setEmail(customer.email || '')
        setAddress(customer.address || '')
        setStatus(customer.status || 'ACTIVE')
      } else {
        setName('')
        setPhone('')
        setEmail('')
        setAddress('')
        setStatus('ACTIVE')
      }
      setError('')
      setFieldErrors(undefined)
    }
  }, [isOpen, customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors(undefined)

    if (!name.trim()) {
      setError('Customer name is required.')
      return
    }

    if (!phone.trim()) {
      setError('Customer phone number is required.')
      return
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      status,
    }

    try {
      if (isEditing && customer) {
        const updated = await updateMutation.mutateAsync({ id: customer.id, data: payload })
        toast.success(`Customer "${updated.name}" updated successfully.`)
        onClose()
        if (onSuccess) onSuccess(updated)
      } else {
        const created = await createMutation.mutateAsync(payload)
        toast.success(`Customer "${created.name}" created successfully.`)
        onClose()
        if (onSuccess) onSuccess(created)
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setFieldErrors(getValidationErrors(err))
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Customer: ${customer?.name}` : 'Add New Customer'}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && <ErrorAlert message={error} validationErrors={fieldErrors} />}

        <Input
          label="Customer Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramesh Patel"
        />

        <Input
          label="Phone Number"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 9876543210"
        />

        <Input
          label="Email (Optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. customer@example.com"
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="customer-address" className="block text-xs font-semibold text-slate-700">
            Address / Notes (Optional)
          </label>
          <textarea
            id="customer-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop 4, Station Road, Pune"
            className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        {isEditing && (
          <Select
            label="Account Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        )}
      </form>
    </Modal>
  )
}
