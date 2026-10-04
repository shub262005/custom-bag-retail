import { Skeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Search } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDate, formatINR } from '../../utils/formatters'
import { BAG_TEMPLATES } from './three/bagTemplates'
import { CustomBagStatusBadge } from './CustomBagStatusBadge'
import { useAdminCustomBagRequests } from './useAdminCustomBagRequests'
import type { CustomBagRequestStatus } from './customBagRequestApi'

const statuses: Array<CustomBagRequestStatus | ''> = ['', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']
export function AdminCustomBagRequestsPage() {
  const [status, setStatus] = useState<CustomBagRequestStatus | ''>('')
  const [requestNumber, setRequestNumber] = useState('')
  const [customer, setCustomer] = useState('')
  const debouncedRequestNumber = useDebounce(requestNumber, 300)
  const debouncedCustomer = useDebounce(customer, 300)
  const query = useAdminCustomBagRequests({ status, requestNumber: debouncedRequestNumber, customer: debouncedCustomer })
  return <div className="space-y-5">
    <PageHeader title="Custom Bag Requests" description="Review customer designs and update their request status." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Custom Bag Requests' }]} />
    <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <label className="text-xs font-semibold text-slate-600">Status<select value={status} onChange={e => setStatus(e.target.value as CustomBagRequestStatus | '')} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"><option value="">All statuses</option>{statuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Request Number<div className="relative mt-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><input value={requestNumber} onChange={e => setRequestNumber(e.target.value)} className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm" placeholder="CBR-2026…" /></div></label>
      <label className="text-xs font-semibold text-slate-600">Customer<input value={customer} onChange={e => setCustomer(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" placeholder="Name or email" /></label>
    </section>
    {query.isLoading && <div role="status" aria-label="Loading requests" className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>}
    {query.isError && <ErrorAlert title="Could not load requests" message="The request inbox is temporarily unavailable." onRetry={() => query.refetch()} />}
    {query.data?.length === 0 && <div className="rounded-xl border border-dashed bg-white p-12 text-center"><Inbox className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 font-semibold">{status || requestNumber || customer ? 'No requests match these filters.' : 'No custom bag requests have been submitted yet.'}</h2></div>}
    {!!query.data?.length && <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Request Number','Customer','Bag Type','Estimated Price','Status','Submitted','Updated','Action'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{query.data.map(r => <tr key={r.id}><td className="px-4 py-3 font-semibold">{r.requestNumber}</td><td className="px-4 py-3"><div>{r.customer.name}</div><div className="text-xs text-slate-500">{r.customer.email}</div></td><td className="px-4 py-3">{BAG_TEMPLATES[r.bagType].label}</td><td className="px-4 py-3">{formatINR(r.estimatedPrice)}</td><td className="px-4 py-3"><CustomBagStatusBadge status={r.status} /></td><td className="px-4 py-3">{formatDate(r.createdAt)}</td><td className="px-4 py-3">{formatDate(r.updatedAt)}</td><td className="px-4 py-3"><Link className="font-semibold text-blue-600 hover:text-blue-700" to={`/custom-bag-requests/${r.id}`}>Review</Link></td></tr>)}</tbody></table></div>}
  </div>
}
