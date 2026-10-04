import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useDebounce } from '../../hooks/useDebounce'
import { getErrorMessage } from '../../api/errorParser'
import { formatDate, formatINR } from '../../utils/formatters'
import type { SaleFilterParams } from '../../types/sale.types'
import { useSales } from './useSales'
import { paymentLabel, paymentOptions } from './saleForm'

export function SalesListPage() {
  const [filters, setFilters] = useState<SaleFilterParams>({})
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const saleNumber = useDebounce(filters.saleNumber ?? '', 300)
  const search = useDebounce(filters.search ?? '', 300)
  const invalidRange = !!(filters.startDate && filters.endDate && filters.startDate > filters.endDate)
  const query = useSales({ ...filters, saleNumber, search }, { enabled: !invalidRange })
  const sales = query.data ?? []
  const pages = Math.max(1, Math.ceil(sales.length / size))
  const currentPage = Math.min(page, pages)
  function change(key: keyof SaleFilterParams, value: string) { setFilters(prev => ({ ...prev, [key]: value || undefined })); setPage(1) }
  return <div className="space-y-4">
    <PageHeader title="Sales History" description="Completed and cancelled sales." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales' }]} actions={<Link to="/sales/pos"><Button>New Sale</Button></Link>} />
    <section className="p-4 bg-white border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input label="Sale number" placeholder="Search sale number" value={filters.saleNumber ?? ''} onChange={e => change('saleNumber', e.target.value)} />
      <Input label="Product search" placeholder="Name, SKU or barcode" value={filters.search ?? ''} onChange={e => change('search', e.target.value)} />
      <Select label="Status" value={filters.status ?? ''} onChange={e => change('status', e.target.value)} options={[{ value: '', label: 'All statuses' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' }]} />
      <Select label="Payment method" value={filters.paymentMethod ?? ''} onChange={e => change('paymentMethod', e.target.value)} options={[{ value: '', label: 'All methods' }, ...paymentOptions]} />
      <Input label="Start date" type="date" value={filters.startDate ?? ''} onChange={e => change('startDate', e.target.value)} />
      <Input label="End date" type="date" value={filters.endDate ?? ''} onChange={e => change('endDate', e.target.value)} />
      <Button variant="secondary" onClick={() => { setFilters({}); setPage(1) }}>Clear filters</Button>
    </section>
    {invalidRange ? <ErrorAlert message="Start date cannot be after end date." /> : query.isPending ? <SkeletonTable rows={6} cols={7} /> : query.isError ? <ErrorAlert message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /> : !sales.length ? <EmptyState title="No sales found" description="Try clearing filters or create a new sale." /> : <section>
      {search && <p className="text-xs text-slate-500 mb-2">Item counts reflect matching products. Open a sale for its complete item list.</p>}
      <Table><TableHeader><TableRow>{['Sale Number', 'Date', 'Items', 'Grand Total', 'Payment Method', 'Status', 'Actions'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{sales.slice((currentPage - 1) * size, currentPage * size).map(sale => <TableRow key={sale.id}>
        <TableCell><Link className="font-semibold text-blue-700 hover:underline" to={`/sales/${sale.id}`}>{sale.saleNumber}</Link></TableCell><TableCell>{formatDate(sale.saleDate)}</TableCell><TableCell>{sale.items.length}</TableCell><TableCell>{formatINR(sale.grandTotal)}</TableCell><TableCell>{paymentLabel(sale.payment?.paymentMethod)}</TableCell><TableCell><Badge variant={sale.status === 'CANCELLED' ? 'danger' : 'success'}>{sale.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}</Badge></TableCell><TableCell><Link className="text-blue-700 hover:underline" to={`/sales/${sale.id}`}>View</Link></TableCell>
      </TableRow>)}</TableBody></Table>
      <Pagination currentPage={currentPage} totalPages={pages} totalItems={sales.length} pageSize={size} onPageChange={setPage} onPageSizeChange={n => { setSize(n); setPage(1) }} />
    </section>}
  </div>
}
