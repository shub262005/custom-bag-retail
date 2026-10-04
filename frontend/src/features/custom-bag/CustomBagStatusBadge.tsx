import type { CustomBagRequestStatus } from './customBagRequestApi'

const styles: Record<CustomBagRequestStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  REVIEWING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function CustomBagStatusBadge({ status }: { status: CustomBagRequestStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
    {status.charAt(0) + status.slice(1).toLowerCase()}
  </span>
}
