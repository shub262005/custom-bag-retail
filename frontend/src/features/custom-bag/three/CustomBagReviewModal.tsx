import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { ErrorAlert } from '../../../components/ui/ErrorAlert'
import { formatINR } from '../../../utils/formatters'
import { getErrorMessage } from '../../../api/errorParser'
import { submitCustomBagRequest, type CustomBagRequestResponse } from '../customBagRequestApi'
import type { BagConfiguration } from './bagConfiguration'
import type { BagPriceResult } from './bagPricing'
import { BAG_TEMPLATES } from './bagTemplates'
import { BagPreview3D } from './BagPreview3D'

interface Props {
  configuration: BagConfiguration
  price: BagPriceResult
  logoFile: File | null
  onClose: () => void
  onSubmitted: (response: CustomBagRequestResponse) => void
}

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase())

export function CustomBagReviewModal({ configuration, price, logoFile, onClose, onSubmitted }: Props) {
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const template = BAG_TEMPLATES[configuration.bagType]

  const submit = async () => {
    setPending(true); setError(null)
    try { onSubmitted(await submitCustomBagRequest(configuration, notes, logoFile)) }
    catch (requestError) { setError(getErrorMessage(requestError)) }
    finally { setPending(false) }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Review custom bag request">
    <div className="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div><h2 className="text-lg font-bold">Review Request</h2><p className="text-xs text-slate-500">The final request will be reviewed by the store.</p></div>
        <button type="button" aria-label="Close review" onClick={onClose} disabled={pending}><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="min-h-96 overflow-hidden rounded-lg border border-slate-200"><BagPreview3D configuration={configuration} /></div>
        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-slate-500">Bag type</dt><dd className="font-semibold">{template.label}</dd>
            <dt className="text-slate-500">Size / Material</dt><dd>{label(configuration.size)} / {label(configuration.material)}</dd>
            <dt className="text-slate-500">Colors</dt><dd>{label(configuration.bodyColor)}, {label(configuration.pocketColor)}, {label(configuration.strapColor)}</dd>
            <dt className="text-slate-500">Compartments</dt><dd>{configuration.compartmentCount}</dd>
            <dt className="text-slate-500">Features</dt><dd>{[configuration.frontPocket && 'Front pocket', configuration.sidePockets && 'Side pockets', configuration.laptopPadding && 'Laptop padding', configuration.waterResistant && 'Water resistant'].filter(Boolean).join(', ') || 'None'}</dd>
            <dt className="text-slate-500">Logo</dt><dd>{logoFile ? logoFile.name : 'Not included'}</dd>
            <dt className="text-slate-500">Custom text</dt><dd>{configuration.customText.trim() || 'Not included'}</dd>
            <dt className="text-slate-500">Live estimate</dt><dd className="font-bold text-blue-600">{formatINR(price.total)}</dd>
          </dl>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Customer notes</span><textarea value={notes} maxLength={1000} onChange={e => setNotes(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-slate-200 p-3" placeholder="Anything the store should know about this request?" /></label>
          {error && <ErrorAlert title="Request could not be submitted" message={error} />}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" onClick={onClose} disabled={pending}>Back to Design</Button><Button onClick={submit} isLoading={pending} disabled={pending}>Submit Custom Bag Request</Button></div>
    </div>
  </div>
}
