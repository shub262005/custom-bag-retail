import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useSuppliers } from './useSuppliers'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import { Plus, Trash2, Phone, Mail, Building2 } from 'lucide-react'
import type { SupplierResponse, SupplierRequest, SupplierPhoneRequest, SupplierEmailRequest } from '../../types'

export interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  supplierToEdit?: SupplierResponse | null
}

interface FormPhoneItem {
  phoneNumber: string
  label: string
}

interface FormEmailItem {
  email: string
  label: string
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const isEditing = !!supplierToEdit
  const toast = useToast()
  const { createSupplierMutation, updateSupplierMutation } = useSuppliers()

  // Form states
  const [name, setName] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phones, setPhones] = useState<FormPhoneItem[]>([])
  const [emails, setEmails] = useState<FormEmailItem[]>([])

  // Error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverValidationErrors, setServerValidationErrors] = useState<Record<string, string> | undefined>(undefined)

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || '')
      setGstNumber(supplierToEdit.gstNumber || '')
      setAddress(supplierToEdit.address || '')
      setPhones(
        supplierToEdit.phones && supplierToEdit.phones.length > 0
          ? supplierToEdit.phones.map((p) => ({
              phoneNumber: p.phoneNumber || '',
              label: p.label || '',
            }))
          : []
      )
      setEmails(
        supplierToEdit.emails && supplierToEdit.emails.length > 0
          ? supplierToEdit.emails.map((e) => ({
              email: e.email || '',
              label: e.label || '',
            }))
          : []
      )
    } else {
      setName('')
      setGstNumber('')
      setAddress('')
      setPhones([])
      setEmails([])
    }

    setFieldErrors({})
    setServerError(null)
    setServerValidationErrors(undefined)
  }, [supplierToEdit, isOpen])

  const handleAddPhone = () => {
    setPhones((prev) => [...prev, { phoneNumber: '', label: '' }])
  }

  const handleRemovePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index))
    // Clear phone field error if present
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[`phone_${index}`]
      return copy
    })
  }

  const handlePhoneChange = (index: number, field: keyof FormPhoneItem, value: string) => {
    setPhones((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
    if (field === 'phoneNumber' && fieldErrors[`phone_${index}`]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[`phone_${index}`]
        return copy
      })
    }
  }

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, { email: '', label: '' }])
  }

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index))
    // Clear email field error if present
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[`email_${index}`]
      return copy
    })
  }

  const handleEmailChange = (index: number, field: keyof FormEmailItem, value: string) => {
    setEmails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
    if (field === 'email' && fieldErrors[`email_${index}`]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[`email_${index}`]
        return copy
      })
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    setServerError(null)
    setServerValidationErrors(undefined)

    // Name validation
    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Supplier name is required'
    } else if (trimmedName.length > 150) {
      errors.name = 'Supplier name cannot exceed 150 characters'
    }

    // GST validation
    const trimmedGst = gstNumber.trim()
    if (trimmedGst && trimmedGst.length > 50) {
      errors.gstNumber = 'GST number cannot exceed 50 characters'
    }

    // Address validation
    const trimmedAddress = address.trim()
    if (trimmedAddress && trimmedAddress.length > 500) {
      errors.address = 'Address cannot exceed 500 characters'
    }

    // Phones validation
    phones.forEach((item, index) => {
      const trimmedPhone = item.phoneNumber.trim()
      const trimmedLabel = item.label.trim()
      if (!trimmedPhone && trimmedLabel) {
        errors[`phone_${index}`] = 'Phone number is required when label is provided'
      } else if (trimmedPhone.length > 50) {
        errors[`phone_${index}`] = 'Phone number cannot exceed 50 characters'
      } else if (trimmedLabel.length > 50) {
        errors[`phone_label_${index}`] = 'Label cannot exceed 50 characters'
      }
    })

    // Emails validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    emails.forEach((item, index) => {
      const trimmedEmail = item.email.trim()
      const trimmedLabel = item.label.trim()
      if (!trimmedEmail && trimmedLabel) {
        errors[`email_${index}`] = 'Email is required when label is provided'
      } else if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
        errors[`email_${index}`] = 'Please enter a valid email address'
      } else if (trimmedEmail.length > 100) {
        errors[`email_${index}`] = 'Email cannot exceed 100 characters'
      } else if (trimmedLabel.length > 50) {
        errors[`email_label_${index}`] = 'Label cannot exceed 50 characters'
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isSubmitting = createSupplierMutation.isPending || updateSupplierMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // Filter out completely blank phone rows
    const validPhones: SupplierPhoneRequest[] = phones
      .filter((p) => p.phoneNumber.trim().length > 0)
      .map((p) => ({
        phoneNumber: p.phoneNumber.trim(),
        label: p.label.trim() || undefined,
      }))

    // Filter out completely blank email rows
    const validEmails: SupplierEmailRequest[] = emails
      .filter((e) => e.email.trim().length > 0)
      .map((e) => ({
        email: e.email.trim(),
        label: e.label.trim() || undefined,
      }))

    const payload: SupplierRequest = {
      name: name.trim(),
      gstNumber: gstNumber.trim() || undefined,
      address: address.trim() || undefined,
      phones: validPhones,
      emails: validEmails,
    }

    try {
      if (isEditing && supplierToEdit) {
        await updateSupplierMutation.mutateAsync({ id: supplierToEdit.id, data: payload })
        toast.success(`Supplier "${payload.name}" updated successfully`)
      } else {
        await createSupplierMutation.mutateAsync(payload)
        toast.success(`Supplier "${payload.name}" created successfully`)
      }
      onClose()
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err)
      const validationMap = getValidationErrors(err)

      setServerError(errorMsg)
      if (validationMap) {
        setServerValidationErrors(validationMap)
        // Map any top-level backend validation errors to fieldErrors
        const newFieldErrors: Record<string, string> = {}
        if (validationMap.name) newFieldErrors.name = validationMap.name
        if (validationMap.gstNumber) newFieldErrors.gstNumber = validationMap.gstNumber
        if (validationMap.address) newFieldErrors.address = validationMap.address
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }))
      }
      toast.error(errorMsg)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Supplier: ${supplierToEdit.name}` : 'Create New Supplier'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <ErrorAlert
            message={serverError}
            validationErrors={serverValidationErrors}
          />
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            General Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name"
              required
              placeholder="e.g. VIP Luggage Ltd."
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev }
                    delete copy.name
                    return copy
                  })
                }
              }}
              error={fieldErrors.name || serverValidationErrors?.name}
              maxLength={150}
            />

            <Input
              label="GST Number"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => {
                setGstNumber(e.target.value)
                if (fieldErrors.gstNumber) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev }
                    delete copy.gstNumber
                    return copy
                  })
                }
              }}
              error={fieldErrors.gstNumber || serverValidationErrors?.gstNumber}
              helperText="Optional. Unique across suppliers."
              maxLength={50}
            />
          </div>

          <div className="w-full flex flex-col gap-1 text-left">
            <label htmlFor="supplier-address" className="block text-xs font-semibold text-slate-700">
              Address
            </label>
            <textarea
              id="supplier-address"
              rows={3}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                if (fieldErrors.address) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev }
                    delete copy.address
                    return copy
                  })
                }
              }}
              placeholder="Enter complete supplier street address, city, state, postal code..."
              maxLength={500}
              className={`w-full rounded-md border text-sm text-slate-900 placeholder:text-slate-400 bg-white p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                fieldErrors.address || serverValidationErrors?.address
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.address ? (
              <p className="text-xs text-red-600 mt-0.5 font-medium">{fieldErrors.address}</p>
            ) : (
              <p className="text-xs text-slate-400 text-right">{address.length}/500</p>
            )}
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Contact Numbers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone Numbers
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Add one or more phone numbers with optional descriptive labels.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPhone}
              className="text-xs flex items-center gap-1 border-dashed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Phone
            </Button>
          </div>

          {phones.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 px-3 bg-slate-50 rounded-md border border-slate-200 border-dashed text-center">
              No phone numbers added yet. Click &quot;Add Phone&quot; to add one.
            </div>
          ) : (
            <div className="space-y-2.5">
              {phones.map((phoneItem, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2.5 bg-slate-50/80 rounded-md border border-slate-200"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Phone number (e.g. +91 9876543210)"
                      value={phoneItem.phoneNumber}
                      onChange={(e) => handlePhoneChange(index, 'phoneNumber', e.target.value)}
                      error={fieldErrors[`phone_${index}`]}
                      maxLength={50}
                    />
                    <Input
                      placeholder="Label (e.g. Mobile, Office, WhatsApp)"
                      value={phoneItem.label}
                      onChange={(e) => handlePhoneChange(index, 'label', e.target.value)}
                      error={fieldErrors[`phone_label_${index}`]}
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    title="Remove phone"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-slate-200" />

        {/* Email Addresses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Addresses
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Add one or more email addresses with optional descriptive labels.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEmail}
              className="text-xs flex items-center gap-1 border-dashed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Email
            </Button>
          </div>

          {emails.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 px-3 bg-slate-50 rounded-md border border-slate-200 border-dashed text-center">
              No email addresses added yet. Click &quot;Add Email&quot; to add one.
            </div>
          ) : (
            <div className="space-y-2.5">
              {emails.map((emailItem, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2.5 bg-slate-50/80 rounded-md border border-slate-200"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      type="email"
                      placeholder="Email address (e.g. contact@supplier.com)"
                      value={emailItem.email}
                      onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                      error={fieldErrors[`email_${index}`]}
                      maxLength={100}
                    />
                    <Input
                      placeholder="Label (e.g. Sales, Support, Billing)"
                      value={emailItem.label}
                      onChange={(e) => handleEmailChange(index, 'label', e.target.value)}
                      error={fieldErrors[`email_label_${index}`]}
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    title="Remove email"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
