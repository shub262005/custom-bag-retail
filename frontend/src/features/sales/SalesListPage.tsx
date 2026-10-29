import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, PackageOpen, ExternalLink, Printer } from 'lucide-react'
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
import type { SaleFilterParams, SaleResponse } from '../../types/sale.types'
import { useSales } from './useSales'
import { paymentLabel, paymentOptions } from './saleForm'
import { InvoiceModal } from '../invoices'

export function SalesListPage() {
  const [filters, setFilters] = useState<SaleFilterParams>({})
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<SaleResponse | null>(null)
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
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
      <Table><TableHeader><TableRow>{['Sale Number', 'Date', 'Items in Bill', 'Grand Total', 'Payment Method', 'Status', 'Actions'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{sales.slice((currentPage - 1) * size, currentPage * size).map(sale => {
        const isExpanded = expandedIds.has(sale.id)
        return (
          <React.Fragment key={sale.id}>
            <TableRow className={isExpanded ? 'bg-slate-50/70' : undefined}>
              <TableCell><Link className="font-semibold text-blue-700 hover:underline" to={`/sales/${sale.id}`}>{sale.saleNumber}</Link></TableCell>
              <TableCell>{formatDate(sale.saleDate)}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => toggleExpand(sale.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    isExpanded
                      ? 'bg-rose-100 text-brand-800 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title={isExpanded ? 'Collapse product details' : 'Click to view products in this bill'}
                >
                  <span>{sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-brand-700' : 'text-slate-500'
                    }`}
                  />
                </button>
              </TableCell>
              <TableCell className="font-semibold text-slate-900">{formatINR(sale.grandTotal)}</TableCell>
              <TableCell>{paymentLabel(sale.payment?.paymentMethod)}</TableCell>
              <TableCell><Badge variant={sale.status === 'CANCELLED' ? 'danger' : 'success'}>{sale.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}</Badge></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link className="text-blue-700 hover:underline font-medium text-xs" to={`/sales/${sale.id}`}>View</Link>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceSale(sale)}
                    className="p-1 rounded text-slate-500 hover:text-brand-900 hover:bg-slate-100 transition-colors"
                    title="Print or Export Tax Invoice"
                    aria-label="Invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>

            {isExpanded && (
              <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-b border-slate-200">
                <TableCell colSpan={7} className="p-3 sm:px-6 sm:py-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <PackageOpen className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-slate-900">
                          Products inside Bill #{sale.saleNumber}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{sale.items.length} {sale.items.length === 1 ? 'product' : 'products'} total</span>
                      </div>
                      {sale.customer && (
                        <div className="text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          Customer: <strong className="text-slate-900">{sale.customer.name}</strong> ({sale.customer.phone})
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Product Name</th>
                            <th className="py-2 px-3">SKU / Barcode</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Selling Price</th>
                            <th className="py-2 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sale.items.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {item.productName || 'Unavailable product'}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {item.sku || '—'}{item.barcode ? ` (${item.barcode})` : ''}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800">
                                {item.quantity}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600">
                                {formatINR(item.sellingPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {formatINR(item.itemTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 text-xs font-semibold">
                          <tr>
                            <td colSpan={4} className="pt-2 px-3 text-right text-slate-500">Subtotal:</td>
                            <td colSpan={2} className="pt-2 px-3 text-right text-slate-700">{formatINR(sale.subtotal)}</td>
                          </tr>
                          {sale.discountAmount != null && sale.discountAmount > 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 text-right text-slate-500">
                                {sale.discountPercentage != null && sale.discountPercentage > 0 ? `Discount (${sale.discountPercentage}%):` : 'Discount (Fixed):'}
                              </td>
                              <td colSpan={2} className="px-3 text-right text-emerald-700">-{formatINR(sale.discountAmount)}</td>
                            </tr>
                          )}
                          <tr className="text-sm font-bold text-slate-900">
                            <td colSpan={4} className="pt-1.5 px-3 text-right">Grand Total:</td>
                            <td colSpan={2} className="pt-1.5 px-3 text-right text-base text-brand-700 font-extrabold">{formatINR(sale.grandTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="text-slate-500">
                        Payment: <strong>{paymentLabel(sale.payment?.paymentMethod)}</strong>
                        {sale.dueAmount != null && sale.dueAmount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Due: {formatINR(sale.dueAmount)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedInvoiceSale(sale)}
                        >
                          Print / Export Invoice
                        </Button>
                        <Link
                          to={`/sales/${sale.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Full Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )
      })}</TableBody></Table>
      <Pagination currentPage={currentPage} totalPages={pages} totalItems={sales.length} pageSize={size} onPageChange={setPage} onPageSizeChange={n => { setSize(n); setPage(1) }} />
    </section>}
    <InvoiceModal
      isOpen={Boolean(selectedInvoiceSale)}
      onClose={() => setSelectedInvoiceSale(null)}
      sale={selectedInvoiceSale}
    />
  </div>
}
