import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useCategories } from './useCategories'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import type { CategoryResponse, CategoryStatus } from '../../types'

export interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: CategoryResponse | null
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const isEditing = !!categoryToEdit
  const { createCategoryMutation, updateCategoryMutation } = useCategories()
  const toast = useToast()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<CategoryStatus>('ACTIVE')
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverValidationErrors, setServerValidationErrors] = useState<Record<string, string> | undefined>(undefined)

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name)
      setStatus(categoryToEdit.status)
    } else {
      setName('')
      setStatus('ACTIVE')
    }
    setNameError(null)
    setServerError(null)
    setServerValidationErrors(undefined)
  }, [categoryToEdit, isOpen])

  const validate = (): boolean => {
    setNameError(null)
    setServerError(null)
    setServerValidationErrors(undefined)

    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Category name is required')
      return false
    }
    if (trimmed.length < 2 || trimmed.length > 100) {
      setNameError('Category name must be between 2 and 100 characters')
      return false
    }
    return true
  }

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return

    try {
      if (isEditing && categoryToEdit) {
        await updateCategoryMutation.mutateAsync({
          id: categoryToEdit.id,
          data: { name: name.trim(), status },
        })
        toast.success(`Category "${name.trim()}" updated successfully.`)
      } else {
        await createCategoryMutation.mutateAsync({
          name: name.trim(),
          status,
        })
        toast.success(`Category "${name.trim()}" created successfully.`)
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
      title={isEditing ? 'Edit Category' : 'Add New Category'}
      description={
        isEditing
          ? 'Update the category details. Existing product associations are preserved.'
          : 'Create a new bag category for organizing store catalog items.'
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
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <ErrorAlert
            title="Unable to save category"
            message={serverError}
            validationErrors={serverValidationErrors}
          />
        )}

        <Input
          label="Category Name"
          required
          placeholder="e.g. Travel Backpacks, Handbags, Wallets"
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
          onChange={(e) => setStatus(e.target.value as CategoryStatus)}
          options={[
            { value: 'ACTIVE', label: 'Active (Available for products)' },
            { value: 'INACTIVE', label: 'Inactive (Hidden from new products)' },
          ]}
          disabled={isSubmitting}
          helperText="Active categories can be selected when adding or editing products."
        />
      </form>
    </Modal>
  )
}
