import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useRecordCustomerRepayment } from './useCustomers'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/formatters'
import { localToday, paymentOptions } from '../sales/saleForm'
import { getErrorMessage } from '../../api/errorParser'
import type { PaymentMethod } from '../../types'

interface RecordRepaymentModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: number
  customerName: string
  customerPhone: string
  saleId?: number | null
  saleNumber?: string | null
  maxDueAmount: number
  onSuccess?: () => void
}

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerPhone,
  saleId,
  saleNumber,
  maxDueAmount,
  onSuccess,
}) => {
  const toast = useToast()
  const recordMutation = useRecordCustomerRepayment()

  const [amount, setAmount] = useState<string>(String(maxDueAmount || ''))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [repaymentDate, setRepaymentDate] = useState<string>(localToday())
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setAmount(String(maxDueAmount || ''))
      setPaymentMethod('CASH')
      setRepaymentDate(localToday())
      setNotes('')
      setError('')
    }
  }, [isOpen, maxDueAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = Number(amount)
    if (!amount.trim() || !Number.isFinite(numAmount) || numAmount <= 0) {
      setError('Please enter a valid repayment amount greater than 0.')
      return
    }

    if (maxDueAmount > 0 && numAmount > maxDueAmount) {
      setError(`Repayment amount cannot exceed remaining due of ${formatINR(maxDueAmount)}.`)
      return
    }

    if (!paymentMethod) {
      setError('Please select a payment method.')
      return
    }

    try {
      await recordMutation.mutateAsync({
        customerId,
        saleId: saleId || undefined,
        amount: numAmount,
        paymentMethod,
        repaymentDate,
        notes: notes.trim() || undefined,
      })

      toast.success(`Repayment of ${formatINR(numAmount)} recorded successfully.`)
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Due Repayment"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={recordMutation.isPending}
          >
            Confirm Repayment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && <ErrorAlert message={error} />}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Customer:</span>
            <span>{customerName} ({customerPhone})</span>
          </div>
          {saleNumber && (
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Sale Reference:</span>
              <span className="font-mono">{saleNumber}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-amber-200 pt-1">
            <span>Outstanding Due:</span>
            <span className="text-red-700">{formatINR(maxDueAmount)}</span>
          </div>
        </div>

        <Input
          label="Repayment Amount (₹)"
          type="number"
          min="0.01"
          max={maxDueAmount > 0 ? maxDueAmount : undefined}
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        <Select
          label="Payment Method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          options={paymentOptions}
        />

        <Input
          label="Repayment Date"
          type="date"
          required
          max={localToday()}
          value={repaymentDate}
          onChange={(e) => setRepaymentDate(e.target.value)}
        />

        <Input
          label="Notes / Receipt Reference (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Paid in cash at store counter"
          maxLength={500}
        />
      </form>
    </Modal>
  )
}

