import { Link } from 'react-router-dom'
import { CreditCard, History, IndianRupee, ShoppingCart, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { formatDate, formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { paymentLabel } from '../sales/saleForm'
import { useSalesDashboard } from './useDashboard'

export function CashierDashboardView() {
  const dashboard = useSalesDashboard()

  return <div className="space-y-6">
    <PageHeader
      title="Cashier Dashboard"
      description="Today's sales snapshot and checkout shortcuts."
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
      actions={<div className="flex gap-2">
        <Link to="/sales/pos"><Button leftIcon={<CreditCard className="h-4 w-4" />}>New Sale</Button></Link>
        <Link to="/sales"><Button variant="secondary" leftIcon={<History className="h-4 w-4" />}>Sales History</Button></Link>
      </div>}
    />

    {dashboard.isPending ? <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-32" />)}</div>
      : dashboard.isError ? <ErrorAlert message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
      : <>
        <p className="text-xs text-slate-500">Snapshot for {formatDate(dashboard.data.date)}</p>
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Cashier sales summary">
          <StatCard title="Completed Sales" value={dashboard.data.todayCompletedSalesCount} subtitle="Today" icon={<ShoppingCart className="h-5 w-5 text-blue-600" />} />
          <StatCard title="Sales Amount" value={formatINR(dashboard.data.todayCompletedSalesAmount)} subtitle="Completed sales" icon={<IndianRupee className="h-5 w-5 text-emerald-600" />} />
          <StatCard title="Cancelled Sales" value={dashboard.data.todayCancelledSalesCount} subtitle="View only" icon={<XCircle className="h-5 w-5 text-red-600" />} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h2 className="p-4 font-semibold">Top selling products</h2>
            {!dashboard.data.topSellingProducts.length ? <p className="p-4 text-sm text-slate-500">No completed product sales today.</p> :
              <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Sales</TableHead></TableRow></TableHeader><TableBody>{dashboard.data.topSellingProducts.map((row) => <TableRow key={row.productId}><TableCell>{row.productName}</TableCell><TableCell className="text-right">{row.quantitySold}</TableCell><TableCell className="text-right">{formatINR(row.salesAmount)}</TableCell></TableRow>)}</TableBody></Table>}
          </section>
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h2 className="p-4 font-semibold">Payment methods</h2>
            {!dashboard.data.salesByPaymentMethod.length ? <p className="p-4 text-sm text-slate-500">No completed payments today.</p> :
              <Table><TableHeader><TableRow><TableHead>Method</TableHead><TableHead className="text-right">Sales</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{dashboard.data.salesByPaymentMethod.map((row) => <TableRow key={row.paymentMethod}><TableCell>{paymentLabel(row.paymentMethod)}</TableCell><TableCell className="text-right">{row.salesCount}</TableCell><TableCell className="text-right">{formatINR(row.totalAmount)}</TableCell></TableRow>)}</TableBody></Table>}
          </section>
        </div>
      </>}
  </div>
}
