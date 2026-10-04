import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { getErrorMessage } from '../../api/errorParser'
import { PageHeader } from '../../components/layout/PageHeader'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatINR } from '../../utils/formatters'
import { CustomBagStatusBadge } from './CustomBagStatusBadge'
import { mapToBagConfiguration } from './MyCustomBagRequestDetailPage'
import type { CustomBagRequestStatus } from './customBagRequestApi'
import { BagPreview3D } from './three/BagPreview3D'
import { BAG_COLOR_PALETTE } from './three/bagConfiguration'
import { BAG_TEMPLATES } from './three/bagTemplates'
import { useAdminCustomBagLogo, useAdminCustomBagRequest, useUpdateAdminCustomBagRequest } from './useAdminCustomBagRequests'

const transitions: Partial<Record<CustomBagRequestStatus, CustomBagRequestStatus[]>> = {
  SUBMITTED: ['REVIEWING', 'REJECTED'], REVIEWING: ['APPROVED', 'REJECTED'], APPROVED: ['COMPLETED'],
}
const actions: Record<CustomBagRequestStatus, string> = {
  SUBMITTED: 'Submit', REVIEWING: 'Mark Reviewing', APPROVED: 'Approve', REJECTED: 'Reject',
  COMPLETED: 'Mark Completed', CANCELLED: 'Cancel',
}
const label = (value: string | null) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) : '—'

function SummarySection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">{title}</h2><dl className="mt-3 space-y-2 text-sm">{rows.map(([name, value]) => <div key={name} className="flex justify-between gap-4"><dt className="text-slate-500">{name}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}</dl></section>
}

export function AdminCustomBagRequestDetailPage() {
  const id = Number(useParams().id)
  const toast = useToast()
  const query = useAdminCustomBagRequest(id)
  const request = query.data
  const logoQuery = useAdminCustomBagLogo(id, Boolean(request?.logoReference))
  const mutation = useUpdateAdminCustomBagRequest(id)
  const [noteDraft, setNoteDraft] = useState<{ id: number; value: string } | null>(null)
  const logoUrl = useMemo(() => logoQuery.data ? URL.createObjectURL(logoQuery.data) : null, [logoQuery.data])
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl) }, [logoUrl])
  const configuration = useMemo(() => request ? mapToBagConfiguration(request, logoUrl) : null, [request, logoUrl])

  const update = async (status: CustomBagRequestStatus) => {
    if ((status === 'REJECTED' || status === 'COMPLETED') && !window.confirm(`Confirm ${status.toLowerCase()} status for this request?`)) return
    try { await mutation.mutateAsync({ status, adminNote }); toast.success(`Request marked ${status.toLowerCase()}.`) }
    catch (error) { toast.error(getErrorMessage(error)) }
  }

  if (!Number.isInteger(id) || id <= 0) return <ErrorAlert title="Request not found" message="This custom bag request does not exist." />
  if (query.isLoading) return <div className="rounded-xl border bg-white p-10 text-center text-sm text-slate-500">Loading request…</div>
  if (query.isError || !request || !configuration) return <div className="space-y-4"><Link to="/custom-bag-requests" className="inline-flex items-center gap-1 text-sm text-blue-600"><ArrowLeft className="h-4 w-4" />Back to inbox</Link><ErrorAlert title="Request not found" message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
  const next = transitions[request.status] ?? []
  const adminNote = noteDraft?.id === request.id ? noteDraft.value : request.adminNote ?? ''

  return <div className="space-y-6">
    <PageHeader title={request.requestNumber} description={`${request.customer.name} · ${request.customer.email}`} breadcrumbs={[{ label: 'Custom Bag Requests', href: '/custom-bag-requests' }, { label: request.requestNumber }]} actions={<CustomBagStatusBadge status={request.status} />} />
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Submitted</p><p className="mt-1 text-sm font-medium">{formatDateTime(request.createdAt)}</p></div><div><p className="text-xs text-slate-500">Updated</p><p className="mt-1 text-sm font-medium">{formatDateTime(request.updatedAt)}</p></div><div><p className="text-xs text-slate-500">Estimated Price</p><p className="mt-1 text-xl font-bold text-blue-700">{formatINR(request.estimatedPrice)}</p></div></section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]"><div><BagPreview3D configuration={configuration} />{logoQuery.isError && <p className="mt-2 flex items-center gap-2 text-xs text-amber-700"><ImageOff className="h-4 w-4" />The protected logo could not be loaded.</p>}</div><div className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
      <SummarySection title="Bag" rows={[["Model", BAG_TEMPLATES[request.bagType].label], ["Size", label(request.size)], ["Material", label(request.material)]]} />
      <SummarySection title="Appearance" rows={[["Body", BAG_COLOR_PALETTE[request.bodyColor].label], ["Pocket", BAG_COLOR_PALETTE[request.pocketColor].label], ["Strap", BAG_COLOR_PALETTE[request.strapColor].label]]} />
      <SummarySection title="Features" rows={[["Front pocket", request.frontPocket ? 'Included' : 'Not included'], ["Side pockets", request.sidePockets ? 'Included' : 'Not included'], ["Compartments", String(request.compartmentCount)], ["Laptop padding", request.laptopPadding ? 'Included' : 'Not included'], ["Water resistant", request.waterResistant ? 'Included' : 'Not included']]} />
      <SummarySection title="Branding" rows={[["Logo", request.logoReference ? 'Included' : 'Not included'], ["Logo position", label(request.logoPosition)], ["Custom text", request.customText || 'Not included'], ["Text color", label(request.textColor)], ["Text position", label(request.textPosition)]]} />
    </div></div>
    {request.customerNotes && <SummarySection title="Customer Notes" rows={[["Notes", request.customerNotes]]} />}
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Admin Review</h2><label className="mt-4 block text-sm font-medium text-slate-700">Note to customer<textarea value={adminNote} onChange={e => setNoteDraft({ id: request.id, value: e.target.value })} maxLength={1000} rows={4} className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Add context for the customer…" /></label><p className="text-right text-xs text-slate-500">{adminNote.length}/1000</p>{next.length ? <div className="mt-4 flex flex-wrap gap-3">{next.map(status => <button key={status} type="button" disabled={mutation.isPending} onClick={() => void update(status)} className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${status === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{actions[status]}</button>)}</div> : <p className="mt-4 text-sm text-slate-500">This request is in a terminal state and cannot be changed.</p>}</section>
  </div>
}
