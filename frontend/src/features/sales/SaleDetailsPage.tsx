import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { formatDate, formatDateTime, formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { useSale, useSaleInventory, useSaleAudit, validSaleId } from './useSales'
import { paymentLabel, cancellationOptions } from './saleForm'
import { SaleCancellationModal } from './SaleCancellationModal'
import { RecordRepaymentModal } from '../customers/RecordRepaymentModal'
import { useAuth } from '../../hooks/useAuth'

export function SaleDetailsPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const saleId = Number(id)
  const query = useSale(saleId)
  const inventory = useSaleInventory(saleId)
  const audit = useSaleAudit(saleId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [repayOpen, setRepayOpen] = useState(false)
  if (!validSaleId(saleId)) return <ErrorAlert message="Invalid sale ID." />
  if (query.isPending) return <SkeletonTable rows={5} cols={5} />
  if (query.isError) return <div className="space-y-4"><ErrorAlert message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /><Link to="/sales" className="text-blue-700">Back to Sales</Link></div>
  const sale = query.data
  const cancelled = sale.status === 'CANCELLED'
  const canCancel = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER'
  return <div className="space-y-5">
    <PageHeader title={sale.saleNumber} description={`Sale date: ${formatDate(sale.saleDate)}`} breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: sale.saleNumber }]} actions={<div className="flex gap-2"><Link to="/sales"><Button variant="secondary">Back to Sales</Button></Link>{!cancelled && <><Link to={`/sales/${sale.id}/edit`}><Button variant="secondary">Edit Sale</Button></Link>{canCancel && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Sale</Button>}</>}</div>} />
    <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500"><Badge variant={cancelled ? 'danger' : 'success'}>{sale.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}</Badge><span>Created: {formatDateTime(sale.createdAt)}</span><span>Updated: {formatDateTime(sale.updatedAt)}</span></div>
    {cancelled && <section className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm space-y-1"><h2 className="font-semibold text-red-900">Cancelled sale — read only</h2><p>{cancellationOptions.find(o => o.value === sale.cancellationReason)?.label ?? sale.cancellationReason}</p><p>{sale.cancellationDescription || 'No description'}</p><p>Cancelled {formatDateTime(sale.cancelledAt)} by {sale.cancelledBy || '—'}</p><p>Stock restored. Payment and sale history retained.</p></section>}
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden"><h2 className="p-4 font-semibold">Sale items</h2><Table><TableHeader><TableRow>{['Product', 'SKU', 'Barcode', 'Quantity', 'Selling Price', 'Item Total'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{sale.items.map(i => <TableRow key={i.id}><TableCell>{i.productName || 'Unavailable product'}</TableCell><TableCell>{i.sku || '—'}</TableCell><TableCell>{i.barcode || '—'}</TableCell><TableCell>{i.quantity}</TableCell><TableCell>{formatINR(i.sellingPrice)}</TableCell><TableCell>{formatINR(i.itemTotal)}</TableCell></TableRow>)}</TableBody></Table></section>
    <div className={`grid gap-4 ${sale.customer ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      <section className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-sm">
        <h2 className="font-semibold text-slate-800">Totals</h2>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatINR(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>{sale.discountPercentage != null && sale.discountPercentage > 0 ? `Discount (${sale.discountPercentage}%)` : (sale.discountAmount != null && sale.discountAmount > 0 ? 'Discount (Fixed)' : 'Discount')}</span>
          <span>{formatINR(sale.discountAmount ?? 0)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-3 border-slate-200">
          <span>Grand Total</span>
          <span className="text-slate-900">{formatINR(sale.grandTotal)}</span>
        </div>
      </section>

      <section className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Payment & Dues</h2>
          {sale.paymentStatus && (
            <Badge
              variant={
                sale.paymentStatus === 'PAID'
                  ? 'success'
                  : sale.paymentStatus === 'PARTIALLY_PAID'
                  ? 'warning'
                  : 'danger'
              }
            >
              {sale.paymentStatus.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Paid Amount</span>
          <strong className="text-emerald-700">{formatINR(sale.paidAmount ?? (sale.payment?.amount ?? sale.grandTotal))}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Due Amount</span>
          <strong className={sale.dueAmount && sale.dueAmount > 0 ? 'text-amber-700 font-bold' : 'text-slate-700'}>
            {formatINR(sale.dueAmount ?? 0)}
          </strong>
        </div>
        {sale.payment && (
          <>
            <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Primary Method</span>
              <span>{paymentLabel(sale.payment.paymentMethod)}</span>
            </div>
            {sale.payment.description && (
              <p className="text-xs text-slate-500">Note: {sale.payment.description}</p>
            )}
          </>
        )}
        {sale.dueAmount != null && sale.dueAmount > 0 && !cancelled && sale.customer && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-amber-800 border-amber-300 hover:bg-amber-50"
              onClick={() => setRepayOpen(true)}
            >
              Collect Due Repayment
            </Button>
          </div>
        )}
      </section>

      {sale.customer && (
        <section className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Customer</h2>
            <Link
              to={`/customers/${sale.customer.id}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Ledger →
            </Link>
          </div>
          <p><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{sale.customer.name}</strong></p>
          <p>
            <span className="text-slate-500">Phone:</span>{' '}
            <a href={`tel:${sale.customer.phone}`} className="text-blue-600 hover:underline font-medium">
              {sale.customer.phone}
            </a>
          </p>
          {sale.customer.email && (
            <p><span className="text-slate-500">Email:</span> {sale.customer.email}</p>
          )}
          <div className="pt-2 mt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Total Outstanding Balance: </span>
            <strong className="text-amber-700 font-semibold">{formatINR(sale.customer.totalDueAmount)}</strong>
          </div>
        </section>
      )}
    </div>
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden"><h2 className="p-4 font-semibold">Inventory movements</h2>{inventory.isPending ? <SkeletonTable rows={3} cols={7} /> : inventory.isError ? <ErrorAlert message={getErrorMessage(inventory.error)} onRetry={() => inventory.refetch()} /> : !inventory.data.length ? <EmptyState title="No inventory movements" /> : <Table><TableHeader><TableRow>{['Type', 'Product', 'Quantity', 'Before → After', 'Movement date', 'Reference', 'Reason'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{inventory.data.map(t => <TableRow key={t.id}><TableCell><Badge variant={t.transactionType === 'STOCK_IN' ? 'success' : 'warning'}>{t.transactionType}</Badge></TableCell><TableCell>{t.productName}<div className="text-xs text-slate-500">{t.productSku}</div></TableCell><TableCell>{t.quantity}</TableCell><TableCell>{t.quantityBefore} → {t.quantityAfter}</TableCell><TableCell>{formatDate(t.movementDate)}</TableCell><TableCell>{t.referenceType}<div className="text-xs">{t.referenceId}</div></TableCell><TableCell>{t.reason || '—'}</TableCell></TableRow>)}</TableBody></Table>}</section>
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden"><h2 className="p-4 font-semibold">Audit history</h2>{audit.isPending ? <SkeletonTable rows={3} cols={4} /> : audit.isError ? <ErrorAlert message={getErrorMessage(audit.error)} onRetry={() => audit.refetch()} /> : !audit.data.length ? <EmptyState title="No audit history" /> : <Table><TableHeader><TableRow>{['Action', 'Description', 'User', 'Timestamp'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{audit.data.map(a => <TableRow key={a.id}><TableCell>{a.actionType}</TableCell><TableCell>{a.description || '—'}</TableCell><TableCell>{a.userId || '—'}</TableCell><TableCell>{formatDateTime(a.createdAt)}</TableCell></TableRow>)}</TableBody></Table>}</section>
    {cancelOpen && canCancel && !cancelled && <SaleCancellationModal sale={sale} onClose={() => setCancelOpen(false)} />}
    {repayOpen && sale.customer && (
      <RecordRepaymentModal
        isOpen={repayOpen}
        onClose={() => setRepayOpen(false)}
        customerId={sale.customer.id}
        customerName={sale.customer.name}
        customerPhone={sale.customer.phone}
        saleId={sale.id}
        saleNumber={sale.saleNumber}
        maxDueAmount={sale.dueAmount ?? 0}
        onSuccess={() => {
          query.refetch()
          setRepayOpen(false)
        }}
      />
    )}
  </div>
}
