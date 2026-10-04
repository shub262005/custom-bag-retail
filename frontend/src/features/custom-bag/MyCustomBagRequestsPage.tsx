import { Skeleton } from '../../components/ui/Skeleton'
import { Link } from 'react-router-dom'
import { PackageOpen, Plus, ArrowRight } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { formatDate, formatINR } from '../../utils/formatters'
import { BAG_COLOR_PALETTE } from './three/bagConfiguration'
import { BAG_TEMPLATES } from './three/bagTemplates'
import { CustomBagStatusBadge } from './CustomBagStatusBadge'
import { useMyCustomBagRequests } from './useMyCustomBagRequests'

const actionClass = 'inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700'
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase())

export function MyCustomBagRequestsPage() {
  const query = useMyCustomBagRequests()
  return <div>
    <PageHeader title="My Custom Bag Requests" description="View your submitted designs and their current status."
      breadcrumbs={[{ label: 'My Custom Bag Requests' }]}
      actions={<Link to="/custom-bag" className={actionClass}><Plus className="h-4 w-4" />Create New Design</Link>} />
    {query.isLoading && <div role="status" aria-label="Loading requests" className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>}
    {query.isError && <ErrorAlert title="Could not load requests" message="Your custom bag request history is temporarily unavailable." onRetry={() => query.refetch()} />}
    {query.data?.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <PackageOpen className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 font-semibold text-slate-900">You haven't submitted any custom bag requests yet.</h2>
      <Link to="/custom-bag" className={`${actionClass} mt-5`}>Design Your First Bag</Link>
    </div>}
    {!!query.data?.length && <div className="grid gap-4 lg:grid-cols-2">
      {query.data.map(request => <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">Request Number</p><h2 className="font-bold text-slate-900">{request.requestNumber}</h2></div><CustomBagStatusBadge status={request.status} /></div>
        <div className="mt-5 flex gap-4"><span className="h-12 w-12 shrink-0 rounded-lg border border-slate-200" style={{ backgroundColor: BAG_COLOR_PALETTE[request.bodyColor].hex }} aria-label={`${label(request.bodyColor)} body color`} />
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm"><div><dt className="text-xs text-slate-500">Bag</dt><dd>{BAG_TEMPLATES[request.bagType].label}</dd></div><div><dt className="text-xs text-slate-500">Material</dt><dd>{label(request.material)}</dd></div><div><dt className="text-xs text-slate-500">Estimated Price</dt><dd className="font-semibold">{formatINR(request.estimatedPrice)}</dd></div><div><dt className="text-xs text-slate-500">Submitted</dt><dd>{formatDate(request.createdAt)}</dd></div></dl>
        </div><Link to={`/my-custom-bags/${request.id}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View Details <ArrowRight className="h-4 w-4" /></Link>
      </article>)}
    </div>}
  </div>
}
