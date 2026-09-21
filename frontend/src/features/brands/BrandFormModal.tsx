import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useBrands } from './useBrands'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import type { BrandResponse, BrandStatus } from '../../types'

export interface BrandFormModalProps {
  isOpen: boolean
  onClose: () => void
  brandToEdit?: BrandResponse | null
}

export const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  onClose,
  brandToEdit,
}) => {
  const isEditing = !!brandToEdit
  const { createBrandMutation, updateBrandMutation } = useBrands()
  const toast = useToast()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<BrandStatus>('ACTIVE')
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverValidationErrors, setServerValidationErrors] = useState<Record<string, string> | undefined>(undefined)

  useEffect(() => {
    if (brandToEdit) {
      setName(brandToEdit.name)
      setStatus(brandToEdit.status)
    } else {
      setName('')
      setStatus('ACTIVE')
    }
    setNameError(null)
    setServerError(null)
    setServerValidationErrors(undefined)
  }, [brandToEdit, isOpen])

  const validate = (): boolean => {
    setNameError(null)
    setServerError(null)
    setServerValidationErrors(undefined)

    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Brand name is required')
      return false
    }
    if (trimmed.length < 2 || trimmed.length > 100) {
      setNameError('Brand name must be between 2 and 100 characters')
      return false
    }
    return true
  }

  const isSubmitting = createBrandMutation.isPending || updateBrandMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return

    try {
      if (isEditing && brandToEdit) {
        await updateBrandMutation.mutateAsync({
          id: brandToEdit.id,
          data: { name: name.trim(), status },
        })
        toast.success(`Brand "${name.trim()}" updated successfully.`)
      } else {
        await createBrandMutation.mutateAsync({
          name: name.trim(),
          status,
        })
        toast.success(`Brand "${name.trim()}" created successfully.`)
      }
      onClose()
    } catch (err) {
      const msg = getErrorMessage(err)
      const valErrors = getValidationErrors(err)
      setServerError(msg)
      setServerValidationErrors(valErrors)
      if (valErrors?.name) {
        setNameError(valErrors.name)
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Brand' : 'Add New Brand'}
      description={
        isEditing
          ? 'Update brand information. Existing products will retain this brand reference.'
          : 'Register a bag manufacturer or retail brand to categorize inventory.'
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Create Brand'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <ErrorAlert
            title="Unable to save brand"
            message={serverError}
            validationErrors={serverValidationErrors}
          />
        )}

        <Input
          label="Brand Name"
          required
          placeholder="e.g. Wildcraft, American Tourister, Skybags"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          error={nameError || undefined}
          disabled={isSubmitting}
          autoFocus
        />

        <Select
          label="Initial Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BrandStatus)}
          options={[
            { value: 'ACTIVE', label: 'Active (Available for products)' },
            { value: 'INACTIVE', label: 'Inactive (Hidden from new products)' },
          ]}
          disabled={isSubmitting}
          helperText="Active brands can be assigned when adding or editing products."
        />
      </form>
    </Modal>
  )
}
