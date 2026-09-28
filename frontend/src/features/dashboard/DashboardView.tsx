import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, CreditCard, IndianRupee, Package, Receipt, RefreshCw, ShoppingCart, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Skeleton, SkeletonTable } from '../../components/ui/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { useCancelledSalesReport, useCategorySalesReport, useDateRangeSalesReport, usePaymentMethodSalesReport, useProductSalesReport } from '../reports/useReports'
import { useProducts } from '../products/useProducts'
import { cancellationOptions, localToday, paymentLabel } from '../sales/saleForm'
import { formatDate, formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import type { DailySalesReportResponse } from '../../types'

type Period = 'month' | '30days' | '7days'
type TrendInterval = 'day' | 'month'
type TrendRow = { key: string; label: string; title: string; totalSalesAmount: number }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const localDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const ranges = (period: Period) => {
  const end = localDate(localToday()), start = new Date(end)
  if (period === 'month') start.setDate(1)
  else start.setDate(start.getDate() - (period === '30days' ? 29 : 6))
  return { startDate: iso(start), endDate: iso(end) }
}
const periodLabels: Record<Period, string> = { month: 'This Month', '30days': 'Last 30 Days', '7days': 'Last 7 Days' }
const cancelLabel = (value: string) => cancellationOptions.find((o) => o.value === value)?.label ?? value.replaceAll('_', ' ')

function fillDates(start: string, end: string, rows: DailySalesReportResponse[]) {
  const indexed = new Map(rows.map((r) => [r.date, r])), result: DailySalesReportResponse[] = []
  for (const cursor = localDate(start), last = localDate(end); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    const date = iso(cursor)
    result.push(indexed.get(date) ?? { date, totalSalesAmount: 0, totalSalesCount: 0 })
  }
  return result
}

function groupTrendRows(rows: DailySalesReportResponse[], interval: TrendInterval): TrendRow[] {
  if (interval === 'day') {
    return rows.map((row) => ({
      key: row.date,
      label: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(localDate(row.date)),
      title: formatDate(row.date),
      totalSalesAmount: row.totalSalesAmount,
    }))
  }

  const months = new Map<string, TrendRow>()
  rows.forEach((row) => {
    const date = localDate(row.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = months.get(key)
    if (existing) {
      existing.totalSalesAmount += row.totalSalesAmount
      return
    }
    months.set(key, {
      key,
      label: new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(date),
      title: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date),
      totalSalesAmount: row.totalSalesAmount,
    })
  })
  return [...months.values()]
}

const QueryError = ({ error, retry }: { error: unknown; retry: () => unknown }) => (
  <div className="p-5"><ErrorAlert message={getErrorMessage(error)} onRetry={retry} /></div>
)

const Trend = ({ rows, interval }: { rows: TrendRow[]; interval: TrendInterval }) => {
  const w = 720, h = 184, left = 62, top = 12, cw = 640, ch = 126
  const max = Math.max(...rows.map((r) => r.totalSalesAmount), 1)
  const points = rows.map((r, i) => ({ ...r, x: left + (rows.length === 1 ? cw / 2 : i / (rows.length - 1) * cw), y: top + ch - r.totalSalesAmount / max * ch }))
  const every = Math.max(1, Math.ceil(rows.length / 6))
  return <div className="overflow-x-auto" role="img" aria-label={`Completed sales by ${interval} line chart`}>
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-150" aria-hidden="true">
      {[0, .25, .5, .75, 1].map((r) => { const y = top + ch - r * ch; return <g key={r}><line x1={left} x2={702} y1={y} y2={y} stroke="#e2e8f0"/><text x={52} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">{formatINR(max * r).replace('.00', '')}</text></g> })}
      <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p, i) => <g key={p.key}><circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#2563eb" strokeWidth="2"><title>{p.title}: {formatINR(p.totalSalesAmount)}</title></circle>{(i % every === 0 || i === points.length - 1) && <text x={p.x} y={170} textAnchor="middle" className="fill-slate-500 text-[10px]">{p.label}</text>}</g>)}
    </svg>
  </div>
}

export const DashboardView: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month')
  const [trendInterval, setTrendInterval] = useState<TrendInterval>('day')
  const range = useMemo(() => ranges(period), [period])
  const sales = useDateRangeSalesReport(range), productsSold = useProductSalesReport(range)
  const categories = useCategorySalesReport(range), payments = usePaymentMethodSalesReport(range)
  const cancelled = useCancelledSalesReport(range), { productsQuery: products } = useProducts({ status: 'ACTIVE' })
  const activeProducts = useMemo(() => products.data ?? [], [products.data])
  const attention = useMemo(() => activeProducts.filter((p) => p.stockQuantity <= p.minimumStock).sort((a, b) => Number(b.stockQuantity <= 0) - Number(a.stockQuantity <= 0) || a.stockQuantity - b.stockQuantity), [activeProducts])
  const outCount = attention.filter((p) => p.stockQuantity <= 0).length
  const lowCount = attention.filter((p) => p.stockQuantity > 0).length
  const top = useMemo(() => [...(productsSold.data ?? [])].sort((a, b) => b.quantitySold - a.quantitySold || b.salesAmount - a.salesAmount).slice(0, 5), [productsSold.data])
  const noSales = useMemo(() => { const sold = new Set((productsSold.data ?? []).filter((r) => r.quantitySold > 0).map((r) => r.productId)); return activeProducts.filter((p) => !sold.has(p.id)).sort((a, b) => b.stockQuantity - a.stockQuantity).slice(0, 5) }, [activeProducts, productsSold.data])
  const daily = useMemo(() => fillDates(range.startDate, range.endDate, sales.data?.dailyBreakdown ?? []), [range, sales.data?.dailyBreakdown])
  const trendRows = useMemo(() => groupTrendRows(daily, trendInterval), [daily, trendInterval])
  const cancelledAmount = (cancelled.data ?? []).reduce((sum, row) => sum + row.grandTotal, 0)
  const average = sales.data?.totalSalesCount ? sales.data.totalSalesAmount / sales.data.totalSalesCount : 0
  const maxCategory = Math.max(...(categories.data ?? []).map((r) => r.salesAmount), 1)
  const maxPayment = Math.max(...(payments.data ?? []).map((r) => r.totalAmount), 1)
  const periodText = `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`
  const queries = [sales, productsSold, categories, payments, cancelled, products]
  const refresh = () => { queries.forEach((q) => { void q.refetch() }) }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <PageHeader title="Business Dashboard" description={`Owner overview for ${periodLabels[period]} · ${periodText}`} breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}/>
      <div className="flex flex-wrap items-center gap-2 self-start">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"><Calendar className="ml-2 h-4 w-4 text-slate-400"/>{(Object.keys(periodLabels) as Period[]).map((p) => <button key={p} type="button" onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{periodLabels[p]}</button>)}</div>
        <Button size="sm" variant="secondary" onClick={refresh} isLoading={queries.some((q) => q.isFetching)} leftIcon={<RefreshCw className="h-3.5 w-3.5"/>}>Refresh</Button>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs"><span className="text-xs font-medium uppercase tracking-wider text-slate-500">Quick Actions</span><div className="flex flex-wrap gap-2"><Link to="/sales/pos"><Button size="sm" leftIcon={<CreditCard className="h-3.5 w-3.5"/>}>New Sale (POS)</Button></Link><Link to="/purchases/new"><Button size="sm" variant="secondary" leftIcon={<Receipt className="h-3.5 w-3.5"/>}>New Purchase</Button></Link><Link to="/inventory"><Button size="sm" variant="secondary" leftIcon={<Package className="h-3.5 w-3.5"/>}>Stock Overview</Button></Link></div></div>

    <section aria-label="Key performance indicators">
      {sales.isPending || cancelled.isPending ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((n) => <Skeleton key={n} className="h-32 rounded-lg"/>)}</div> : sales.isError || cancelled.isError ? <ErrorAlert message={getErrorMessage(sales.error ?? cancelled.error)} onRetry={() => { void sales.refetch(); void cancelled.refetch() }}/> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Sales" value={formatINR(sales.data?.totalSalesAmount)} subtitle="Completed sales only" icon={<IndianRupee className="h-5 w-5 text-emerald-600"/>}/>
        <StatCard title="Completed Orders" value={sales.data?.totalSalesCount ?? 0} subtitle={periodText} icon={<ShoppingCart className="h-5 w-5 text-blue-600"/>}/>
        <StatCard title="Average Order Value" value={formatINR(average)} subtitle="Sales ÷ completed orders" icon={<Receipt className="h-5 w-5 text-violet-600"/>}/>
        <StatCard title="Cancelled Sales" value={cancelled.data?.length ?? 0} subtitle={`${formatINR(cancelledAmount)} cancelled total`} icon={<XCircle className="h-5 w-5 text-red-600"/>}/>
      </div>}
    </section>

    <div className="space-y-6">
      <Card><CardHeader className="py-4"><div><CardTitle>Sales Trend</CardTitle><CardDescription>Completed sales grouped by {trendInterval} · zero-sale dates included</CardDescription></div><div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Sales trend grouping">{(['day', 'month'] as TrendInterval[]).map((interval) => <button key={interval} type="button" onClick={() => setTrendInterval(interval)} aria-pressed={trendInterval === interval} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${trendInterval === interval ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>{interval === 'day' ? 'Daily' : 'Monthly'}</button>)}</div></CardHeader><CardContent className="pb-4 pt-2">{sales.isPending ? <Skeleton className="h-44"/> : sales.isError ? <ErrorAlert message={getErrorMessage(sales.error)} onRetry={() => sales.refetch()}/> : !sales.data?.totalSalesCount ? <EmptyState title="No completed sales in this period" description="The trend will appear when completed sales are recorded."/> : <Trend rows={trendRows} interval={trendInterval}/>}</CardContent></Card>
      <Card><CardHeader><div><CardTitle>Top Selling Products</CardTitle><CardDescription>Ranked by units sold</CardDescription></div></CardHeader><CardContent className="p-0">{productsSold.isPending ? <div className="p-4"><SkeletonTable rows={5} cols={4}/></div> : productsSold.isError ? <QueryError error={productsSold.error} retry={() => productsSold.refetch()}/> : !top.length ? <div className="p-6"><EmptyState title="No product sales in this period" description="Completed item sales will be ranked here."/></div> : <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Gross Item Sales</TableHead></TableRow></TableHeader><TableBody>{top.map((r, i) => <TableRow key={r.productId}><TableCell className="text-slate-400">{i + 1}</TableCell><TableCell><div className="font-medium text-slate-900">{r.productName}</div><div className="font-mono text-[11px] text-slate-500">{r.sku}</div></TableCell><TableCell className="text-right font-medium">{r.quantitySold}</TableCell><TableCell className="text-right font-semibold">{formatINR(r.salesAmount)}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card><CardHeader><div><CardTitle>Sales by Category</CardTitle><CardDescription>Gross item sales by merchandise category</CardDescription></div></CardHeader><CardContent>{categories.isPending ? <Skeleton className="h-56"/> : categories.isError ? <ErrorAlert message={getErrorMessage(categories.error)} onRetry={() => categories.refetch()}/> : !categories.data?.length ? <EmptyState title="No category sales in this period" description="Category performance will appear after completed sales."/> : <div className="space-y-4">{[...categories.data].sort((a,b) => b.salesAmount-a.salesAmount).slice(0,8).map((r) => <div key={r.categoryId}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-medium text-slate-700">{r.categoryName}</span><span>{formatINR(r.salesAmount)} · {r.quantitySold} units</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${r.salesAmount/maxCategory*100}%`}}/></div></div>)}</div>}<p className="mt-4 text-[11px] text-slate-500">Amounts represent item totals before sale-level discounts.</p></CardContent></Card>
      <Card><CardHeader><div><CardTitle>Payment Methods</CardTitle><CardDescription>Completed order totals by tender type</CardDescription></div></CardHeader><CardContent>{payments.isPending ? <Skeleton className="h-56"/> : payments.isError ? <ErrorAlert message={getErrorMessage(payments.error)} onRetry={() => payments.refetch()}/> : !payments.data?.length ? <EmptyState title="No payments in this period" description="Payment distribution will appear after completed sales."/> : <div className="space-y-4">{[...payments.data].sort((a,b) => b.totalAmount-a.totalAmount).map((r) => <div key={r.paymentMethod}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-medium text-slate-700">{paymentLabel(r.paymentMethod)}</span><span>{r.salesCount} orders · {formatINR(r.totalAmount)}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{width:`${r.totalAmount/maxPayment*100}%`}}/></div></div>)}</div>}</CardContent></Card>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2"><CardHeader><div><CardTitle>Inventory Attention</CardTitle><CardDescription>Active products that need restocking</CardDescription></div>{!products.isPending && <div className="flex gap-2"><Badge variant="danger">{outCount} out</Badge><Badge variant="warning">{lowCount} low</Badge></div>}</CardHeader><CardContent className="p-0">{products.isPending ? <div className="p-4"><SkeletonTable rows={5} cols={5}/></div> : products.isError ? <QueryError error={products.error} retry={() => products.refetch()}/> : !attention.length ? <div className="p-6"><EmptyState title="No products currently require restocking" description="All active products are above their minimum stock level."/></div> : <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Minimum</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader><TableBody>{attention.slice(0,8).map((p) => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell><TableCell className={`text-right font-semibold ${p.stockQuantity <= 0 ? 'text-red-600':'text-amber-700'}`}>{p.stockQuantity}</TableCell><TableCell className="text-right">{p.minimumStock}</TableCell><TableCell className="text-right"><Badge variant={p.stockQuantity <= 0 ? 'danger':'warning'}>{p.stockQuantity <= 0 ? 'Out of Stock':'Low Stock'}</Badge></TableCell></TableRow>)}</TableBody></Table>}</CardContent><CardFooter><Link to="/inventory" className="flex items-center gap-1 text-xs font-medium text-blue-600">View Inventory <ArrowRight className="h-3.5 w-3.5"/></Link></CardFooter></Card>
      <Card><CardHeader><div><CardTitle>Products With No Sales</CardTitle><CardDescription>Active products with zero units sold this period</CardDescription></div></CardHeader><CardContent className="p-0">{products.isPending || productsSold.isPending ? <div className="p-4"><SkeletonTable rows={5} cols={3}/></div> : products.isError || productsSold.isError ? <QueryError error={products.error ?? productsSold.error} retry={() => { void products.refetch(); void productsSold.refetch() }}/> : !noSales.length ? <div className="p-6"><EmptyState title="All active products recorded sales" description="Every active product sold at least once in this period."/></div> : <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader><TableBody>{noSales.map((p) => <TableRow key={p.id}><TableCell><div className="font-medium">{p.name}</div><div className="font-mono text-[11px] text-slate-500">{p.sku}</div></TableCell><TableCell className="text-right">{p.stockQuantity}</TableCell><TableCell className="text-right font-medium">{formatINR(p.sellingPrice)}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
    </div>

    <Card><CardHeader><div><CardTitle>Cancellation Monitoring</CardTitle><CardDescription>Most recent cancelled sales in the selected sale-date period</CardDescription></div>{!cancelled.isPending && <Badge variant={(cancelled.data?.length ?? 0) ? 'danger':'success'}>{cancelled.data?.length ?? 0} cancelled</Badge>}</CardHeader><CardContent className="p-0">{cancelled.isPending ? <div className="p-4"><SkeletonTable rows={3} cols={5}/></div> : cancelled.isError ? <QueryError error={cancelled.error} retry={() => cancelled.refetch()}/> : !cancelled.data?.length ? <div className="p-6"><EmptyState title="No cancellations in this period" description="No sales matching the selected sale dates were cancelled."/></div> : <Table><TableHeader><TableRow><TableHead>Sale</TableHead><TableHead>Sale Date</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{[...cancelled.data].sort((a,b)=>(b.cancelledAt??b.saleDate).localeCompare(a.cancelledAt??a.saleDate)).slice(0,5).map((s) => <TableRow key={s.saleId}><TableCell className="font-medium">{s.saleNumber}</TableCell><TableCell>{formatDate(s.saleDate)}</TableCell><TableCell>{cancelLabel(s.cancellationReason)}</TableCell><TableCell className="text-right font-medium">{formatINR(s.grandTotal)}</TableCell><TableCell className="text-right"><Link to={`/sales/${s.saleId}`} className="text-xs font-medium text-blue-600">View Sale</Link></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
  </div>
}
