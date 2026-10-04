import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { formatDateTime, formatINR } from '../../utils/formatters'
import type { CustomBagRequestDetail } from './customBagRequestApi'
import { CustomBagStatusBadge } from './CustomBagStatusBadge'
import { useMyCustomBagLogo, useMyCustomBagRequest } from './useMyCustomBagRequests'
import { BagPreview3D } from './three/BagPreview3D'
import { BAG_COLOR_PALETTE, type BagConfiguration } from './three/bagConfiguration'
import { BAG_TEMPLATES } from './three/bagTemplates'

const label = (value: string | null) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) : '—'

export function mapToBagConfiguration(request: CustomBagRequestDetail, logoImage: string | null): BagConfiguration {
  return {
    bagType: request.bagType, size: request.size, material: request.material,
    bodyColor: request.bodyColor, pocketColor: request.pocketColor, strapColor: request.strapColor,
    frontPocket: request.frontPocket, sidePockets: request.sidePockets,
    compartmentCount: request.compartmentCount, laptopPadding: request.laptopPadding,
    waterResistant: request.waterResistant, logoImage,
    logoPosition: request.logoPosition ?? 'UPPER_FRONT', customText: request.customText ?? '',
    textColor: request.textColor ?? 'WHITE', textPosition: request.textPosition ?? 'CENTER',
  }
}

function SummarySection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">{title}</h2><dl className="mt-3 space-y-2 text-sm">{rows.map(([name, value]) => <div key={name} className="flex justify-between gap-4"><dt className="text-slate-500">{name}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}</dl></section>
}

export function MyCustomBagRequestDetailPage() {
  const id = Number(useParams().id)
  const requestQuery = useMyCustomBagRequest(id)
  const request = requestQuery.data
  const logoQuery = useMyCustomBagLogo(id, Boolean(request?.logoReference))
  const logoUrl = useMemo(() => logoQuery.data ? URL.createObjectURL(logoQuery.data) : null, [logoQuery.data])
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl) }, [logoUrl])
  const configuration = useMemo(() => request ? mapToBagConfiguration(request, logoUrl) : null, [request, logoUrl])

  if (!Number.isInteger(id) || id <= 0) return <ErrorAlert title="Request not found" message="This custom bag request does not exist or is not available to your account." />
  if (requestQuery.isLoading) return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading request…</div>
  if (requestQuery.isError || !request || !configuration) return <div className="space-y-4"><Link to="/my-custom-bags" className="inline-flex items-center gap-1 text-sm text-blue-600"><ArrowLeft className="h-4 w-4" />Back to requests</Link><ErrorAlert title="Request not found" message="This request does not exist or is not available to your account." onRetry={() => requestQuery.refetch()} /></div>

  return <div className="space-y-6">
    <PageHeader title={request.requestNumber} description="Read-only saved custom bag request."
      breadcrumbs={[{ label: 'My Custom Bag Requests', href: '/my-custom-bags' }, { label: request.requestNumber }]}
      actions={<CustomBagStatusBadge status={request.status} />} />
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
      <div><p className="text-xs text-slate-500">Submitted</p><p className="mt-1 text-sm font-medium">{formatDateTime(request.createdAt)}</p></div>
      <div><p className="text-xs text-slate-500">Updated</p><p className="mt-1 text-sm font-medium">{formatDateTime(request.updatedAt)}</p></div>
      <div className="sm:col-span-2"><p className="text-xs text-slate-500">Estimated Price</p><p className="mt-1 text-xl font-bold text-blue-700">{formatINR(request.estimatedPrice)}</p><p className="text-xs text-slate-500">Final price may be confirmed during review.</p></div>
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
      <div><BagPreview3D configuration={configuration} />{logoQuery.isError && <p className="mt-2 flex items-center gap-2 text-xs text-amber-700"><ImageOff className="h-4 w-4" />The saved logo could not be loaded; the bag preview remains available.</p>}</div>
      <div className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <SummarySection title="Bag" rows={[["Model", BAG_TEMPLATES[request.bagType].label], ["Size", label(request.size)], ["Material", label(request.material)]]} />
        <SummarySection title="Appearance" rows={[["Body", BAG_COLOR_PALETTE[request.bodyColor].label], ["Pocket", BAG_COLOR_PALETTE[request.pocketColor].label], ["Strap", BAG_COLOR_PALETTE[request.strapColor].label]]} />
        <SummarySection title="Features" rows={[["Front pocket", request.frontPocket ? 'Included' : 'Not included'], ["Side pockets", request.sidePockets ? 'Included' : 'Not included'], ["Compartments", String(request.compartmentCount)]]} />
        <SummarySection title="Protection" rows={[["Laptop padding", request.laptopPadding ? 'Included' : 'Not included'], ["Water resistant", request.waterResistant ? 'Included' : 'Not included']]} />
        <SummarySection title="Branding" rows={[["Logo", request.logoReference ? 'Included' : 'Not included'], ["Logo position", label(request.logoPosition)], ["Custom text", request.customText || 'Not included'], ["Text position", label(request.textPosition)]]} />
      </div>
    </div>
    {request.customerNotes && <SummarySection title="Customer Notes" rows={[["Notes", request.customerNotes]]} />}
    {request.adminNote && <section className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold text-blue-950">Store Response</h2><p className="mt-2 text-sm text-blue-900">{request.adminNote}</p><div className="mt-3"><CustomBagStatusBadge status={request.status} /></div></section>}
  </div>
}
