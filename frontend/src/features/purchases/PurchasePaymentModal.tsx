import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/formatters'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import {
  useAddPurchasePayment,
  useUpdatePurchasePayment,
} from './usePurchases'
import type {
  PurchaseResponse,
  PurchasePaymentResponse,
  PurchasePaymentRequest,
  PaymentMethod,
} from '../../types'

export interface PurchasePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: PurchaseResponse
  paymentToEdit?: PurchasePaymentResponse | null
}

export const PurchasePaymentModal: React.FC<PurchasePaymentModalProps> = ({
  isOpen,
  onClose,
  purchase,
  paymentToEdit,
}) => {
  const toast = useToast()
  const addPaymentMutation = useAddPurchasePayment()
  const updatePaymentMutation = useUpdatePurchasePayment()

  const isEditMode = Boolean(paymentToEdit)
  const isPending = addPaymentMutation.isPending || updatePaymentMutation.isPending

  const today = new Date().toISOString().split('T')[0]

  // Form state
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState<string>(today)
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // UI state
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // Calculate maximum payment amount allowed
  const maxAllowedAmount = useMemo(() => {
    if (isEditMode && paymentToEdit) {
      // In edit mode: grandTotal - (totalPaid - currentPayment.amount)
      const otherPayments = Math.max(0, purchase.totalPaid - paymentToEdit.amount)
      return Math.max(0, Math.round((purchase.grandTotal - otherPayments) * 100) / 100)
    }
    // New payment mode: remaining balance
    return Math.max(0, purchase.outstandingAmount)
  }, [isEditMode, paymentToEdit, purchase.grandTotal, purchase.totalPaid, purchase.outstandingAmount])

  // Sync state when modal opens or paymentToEdit changes
  useEffect(() => {
    if (isOpen) {
      setClientErrors({})
      setApiError(null)

      if (paymentToEdit) {
        setAmount(String(paymentToEdit.amount))
        setPaymentMethod(paymentToEdit.paymentMethod)
        setPaymentDate(paymentToEdit.paymentDate)
        setPaymentReference(paymentToEdit.paymentReference || '')
        setNotes(paymentToEdit.notes || '')
      } else {
        setAmount(purchase.outstandingAmount > 0 ? String(purchase.outstandingAmount) : '')
        setPaymentMethod('CASH')
        setPaymentDate(today)
        setPaymentReference('')
        setNotes('')
      }
    }
  }, [isOpen, paymentToEdit, purchase.outstandingAmount, today])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Payment amount must be greater than 0'
    } else if (parsedAmount > maxAllowedAmount) {
      errors.amount = `Payment amount cannot exceed ${formatINR(maxAllowedAmount)}`
    }

    if (!paymentDate) {
      errors.paymentDate = 'Payment date is required'
    }

    if (paymentReference && paymentReference.length > 100) {
      errors.paymentReference = 'Reference cannot exceed 100 characters'
    }

    if (notes && notes.length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters'
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    const parsedAmount = parseFloat(amount)
    const payload: PurchasePaymentRequest = {
      amount: parsedAmount,
      paymentMethod,
      paymentDate,
      paymentReference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    try {
      if (isEditMode && paymentToEdit) {
        await updatePaymentMutation.mutateAsync({
          purchaseId: purchase.id,
          paymentId: paymentToEdit.id,
          data: payload,
        })
        toast.success(`Payment of ${formatINR(parsedAmount)} updated successfully.`)
      } else {
        await addPaymentMutation.mutateAsync({
          purchaseId: purchase.id,
          data: payload,
        })
        toast.success(`Payment of ${formatINR(parsedAmount)} recorded successfully.`)
      }
      onClose()
    } catch (err) {
      const msg = getErrorMessage(err)
      setApiError(msg)
      const fieldValidationErrors = getValidationErrors(err)
      if (fieldValidationErrors) {
        setClientErrors((prev) => ({ ...prev, ...fieldValidationErrors }))
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Payment' : 'Record Purchase Payment'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isPending}
          >
            {isEditMode ? 'Save Changes' : 'Record Payment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <ErrorAlert
            title="Payment Error"
            message={apiError}
          />
        )}

        {/* Purchase summary banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Purchase Order:</span>
            <span className="font-semibold text-slate-900">{purchase.purchaseNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Grand Total:</span>
            <span className="font-medium text-slate-900">{formatINR(purchase.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Paid:</span>
            <span className="font-medium text-emerald-700">{formatINR(purchase.totalPaid)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Max Allowed Payment:</span>
            <span className="font-bold text-blue-700">{formatINR(maxAllowedAmount)}</span>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            min="0.01"
            max={maxAllowedAmount}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={clientErrors.amount}
            helperText={`Must be between ₹0.01 and ${formatINR(maxAllowedAmount)}`}
            disabled={isPending}
          />
        </div>

        {/* Payment Method & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              disabled={isPending}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div>
            <Input
              label="Payment Date"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              error={clientErrors.paymentDate}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Reference */}
        <div>
          <Input
            label="Payment Reference"
            placeholder="e.g. UTR / Transaction ID / Cheque #"
            maxLength={100}
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            error={clientErrors.paymentReference}
            disabled={isPending}
          />
        </div>

        {/* Notes */}
        <div>
          <Input
            label="Notes"
            placeholder="Optional payment notes (max 500 characters)"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={clientErrors.notes}
            disabled={isPending}
          />
        </div>
      </form>
    </Modal>
  )
}
