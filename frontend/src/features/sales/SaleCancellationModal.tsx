import { useRef, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import { useToast } from '../../context/ToastContext'
import type { SaleResponse } from '../../types/sale.types'
import type { CancellationReason } from '../../types/common.types'
import { useCancelSale } from './useSales'
import { cancellationOptions } from './saleForm'

export function SaleCancellationModal({ sale, onClose }: { sale: SaleResponse; onClose: () => void }) {
  const mutation = useCancelSale()
  const toast = useToast()
  const sending = useRef(false)
  const [reason, setReason] = useState<CancellationReason | ''>('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string> | undefined>()
  async function submit() {
    if (sending.current || sale.status === 'CANCELLED') return
    if (!reason) { setError('Select a cancellation reason.'); return }
    sending.current = true
    try {
      await mutation.mutateAsync({ id: sale.id, data: { reason, description: description.trim() || undefined } })
      toast.success(`${sale.saleNumber} cancelled. Stock restored.`)
      onClose()
    } catch (err) { setError(getErrorMessage(err)); setFields(getValidationErrors(err)) }
    finally { sending.current = false }
  }
  return <Modal isOpen onClose={() => { if (!mutation.isPending) onClose() }} title={`Cancel ${sale.saleNumber}`} footer={<><Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>Keep Sale</Button><Button variant="danger" isLoading={mutation.isPending} disabled={mutation.isPending} onClick={submit}>Confirm Cancellation</Button></>}>
    <div className="space-y-4"><p className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-900">Cancellation restores all current sale item quantities to inventory. The payment record and sale history are retained. This cannot be undone through this UI.</p>
      {error && <ErrorAlert message={error} validationErrors={fields} />}
      <Select label="Cancellation reason" required value={reason} disabled={mutation.isPending} onChange={e => setReason(e.target.value as CancellationReason)} options={[{ value: '', label: 'Select a reason' }, ...cancellationOptions]} />
      <Input label="Cancellation description" maxLength={500} value={description} disabled={mutation.isPending} onChange={e => setDescription(e.target.value)} helperText="Optional, up to 500 characters." />
    </div>
  </Modal>
}
