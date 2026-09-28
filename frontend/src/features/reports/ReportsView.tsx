import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  Layers,
  CreditCard,
  XCircle,
  Package,
  TrendingUp,
  Receipt,
  RotateCcw,
  Info,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Skeleton, SkeletonTable } from '../../components/ui/Skeleton'
import {
  useDailySalesReport,
  useDateRangeSalesReport,
  useProductSalesReport,
  useCategorySalesReport,
  usePaymentMethodSalesReport,
  useCancelledSalesReport,
  type ReportDateRangeParams,
} from './useReports'
import { localDaysAgo } from './reportUtils'
import { localToday, paymentLabel, cancellationOptions } from '../sales/saleForm'
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'

export type ReportTab = 'summary' | 'products' | 'categories' | 'payments' | 'cancelled'

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('summary')

  // Date range filter state (defaults to approximately last 30 days)
  const [startDate, setStartDate] = useState<string>(localDaysAgo(30))
  const [endDate, setEndDate] = useState<string>(localToday())

  // Single date for daily snapshot
  const [snapshotDate, setSnapshotDate] = useState<string>(localToday())

  // Pagination states for larger lists
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(10)
  const [cancelledPage, setCancelledPage] = useState(1)
  const [cancelledPageSize, setCancelledPageSize] = useState(10)

  // Validation: Check if start date is after end date
  const isInvalidRange = Boolean(startDate && endDate && startDate > endDate)

  const dateParams: ReportDateRangeParams = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [startDate, endDate]
  )

  // Query hooks
  const dateRangeQuery = useDateRangeSalesReport(dateParams, { enabled: activeTab === 'summary' && !isInvalidRange })
  const dailySnapshotQuery = useDailySalesReport(snapshotDate)
  const productQuery = useProductSalesReport(dateParams, { enabled: activeTab === 'products' && !isInvalidRange })
  const categoryQuery = useCategorySalesReport(dateParams, { enabled: activeTab === 'categories' && !isInvalidRange })
  const paymentQuery = usePaymentMethodSalesReport(dateParams, { enabled: activeTab === 'payments' && !isInvalidRange })
  const cancelledQuery = useCancelledSalesReport(dateParams, { enabled: activeTab === 'cancelled' && !isInvalidRange })

  const handleResetDates = () => {
    setStartDate(localDaysAgo(30))
    setEndDate(localToday())
    setProductPage(1)
    setCancelledPage(1)
  }

  const handleClearAllDates = () => {
    setStartDate('')
    setEndDate('')
    setProductPage(1)
    setCancelledPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Reports Center"
        description="Review sales performance, item analytics, payment tenders, and cancellation records."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'summary'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Sales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Sales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Methods</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'cancelled'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Cancelled Sales</span>
        </button>
      </div>

      {/* Shared Date Range Filter Bar */}
      <section className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-800">Date Range Filter</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setStartDate(localToday())
                setEndDate(localToday())
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate(localDaysAgo(7))
                setEndDate(localToday())
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate(localDaysAgo(30))
                setEndDate(localToday())
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={handleClearAllDates}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Clear / All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              aria-label="Start date"
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-blue-500 bg-white"
              value={startDate}
              max={localToday()}
              onChange={(e) => {
                setStartDate(e.target.value)
                setProductPage(1)
                setCancelledPage(1)
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              aria-label="End date"
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-blue-500 bg-white"
              value={endDate}
              max={localToday()}
              onChange={(e) => {
                setEndDate(e.target.value)
                setProductPage(1)
                setCancelledPage(1)
              }}
            />
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetDates}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset to 30 Days
            </Button>
            <span className="text-xs text-slate-500 self-center">
              {startDate && endDate
                ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                : startDate
                ? `From ${formatDate(startDate)}`
                : endDate
                ? `Until ${formatDate(endDate)}`
                : 'Using backend default range (~last 30 days)'}
            </span>
          </div>
        </div>

        {isInvalidRange && (
          <ErrorAlert message="Start date cannot be after end date. Please correct the date range." />
        )}
      </section>

      {/* Tab 1: Sales Summary Report */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Date Range Summary Section */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Period Performance Summary</h2>

            {dateRangeQuery.isPending ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                ))}
              </div>
            ) : dateRangeQuery.isError ? (
              <ErrorAlert
                message={`Error loading sales summary: ${getErrorMessage(dateRangeQuery.error)}`}
                onRetry={() => dateRangeQuery.refetch()}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Completed Sales Revenue"
                  value={formatINR(dateRangeQuery.data?.totalSalesAmount ?? 0)}
                  subtitle="Gross net revenue"
                  icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                />
                <StatCard
                  title="Completed Transactions"
                  value={dateRangeQuery.data?.totalSalesCount ?? 0}
                  subtitle="Orders completed"
                  icon={<Receipt className="w-5 h-5 text-blue-600" />}
                />
                <StatCard
                  title="Period Start"
                  value={formatDate(dateRangeQuery.data?.startDate)}
                  subtitle="Effective boundary"
                  icon={<Calendar className="w-5 h-5 text-slate-500" />}
                />
                <StatCard
                  title="Period End"
                  value={formatDate(dateRangeQuery.data?.endDate)}
                  subtitle="Effective boundary"
                  icon={<Calendar className="w-5 h-5 text-slate-500" />}
                />
              </div>
            )}
          </section>

          {/* Daily Breakdown Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Daily Sales Breakdown</CardTitle>
                <CardDescription>
                  Day-by-day completed sales within the selected range (excludes cancelled orders)
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {dateRangeQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={3} />
                </div>
              ) : dateRangeQuery.isError ? null : !dateRangeQuery.data?.dailyBreakdown?.length ? (
                <div className="p-6">
                  <EmptyState
                    title="No completed sales found for this range"
                    description="There are no completed sales recorded within the specified date boundaries."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale Date</TableHead>
                      <TableHead className="text-right">Completed Sales Count</TableHead>
                      <TableHead className="text-right">Total Sales Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateRangeQuery.data.dailyBreakdown.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium text-slate-900">
                          {formatDate(row.date)}
                        </TableCell>
                        <TableCell className="text-right text-slate-700">
                          {row.totalSalesCount}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(row.totalSalesAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Compact Daily Snapshot Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Single-Day Snapshot</CardTitle>
                <CardDescription>Instant lookup for a specific calendar date</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  aria-label="Snapshot date"
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                  value={snapshotDate}
                  max={localToday()}
                  onChange={(e) => setSnapshotDate(e.target.value || localToday())}
                />
                {snapshotDate !== localToday() && (
                  <Button size="sm" variant="ghost" onClick={() => setSnapshotDate(localToday())}>
                    Today
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {dailySnapshotQuery.isPending ? (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded" />
                  <Skeleton className="h-16 rounded" />
                </div>
              ) : dailySnapshotQuery.isError ? (
                <ErrorAlert message={`Error loading daily snapshot: ${getErrorMessage(dailySnapshotQuery.error)}`} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Orders on {formatDate(dailySnapshotQuery.data?.date)}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {dailySnapshotQuery.data?.totalSalesCount ?? 0}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Revenue on {formatDate(dailySnapshotQuery.data?.date)}
                    </p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      {formatINR(dailySnapshotQuery.data?.totalSalesAmount ?? 0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Product Sales Report */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Product sales amounts are based on item line-totals before sale-level discounts. Cancelled sales are excluded.
            </span>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Quantities sold and revenue generated by individual product</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {productQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={5} cols={4} />
                </div>
              ) : productQuery.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    message={`Error loading product report: ${getErrorMessage(productQuery.error)}`}
                    onRetry={() => productQuery.refetch()}
                  />
                </div>
              ) : !productQuery.data?.length ? (
                <div className="p-6">
                  <EmptyState
                    title="No product sales found for this range"
                    description="No completed item sales exist in the specified date range."
                  />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Quantity Sold</TableHead>
                        <TableHead className="text-right">Gross Item Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productQuery.data
                        .slice((productPage - 1) * productPageSize, productPage * productPageSize)
                        .map((row) => (
                          <TableRow key={row.productId}>
                            <TableCell className="font-medium text-slate-900">
                              {row.productName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-mono">
                              {row.sku}
                            </TableCell>
                            <TableCell className="text-right text-slate-800 font-medium">
                              {row.quantitySold}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">
                              {formatINR(row.salesAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <Pagination
                    currentPage={productPage}
                    totalPages={Math.max(1, Math.ceil(productQuery.data.length / productPageSize))}
                    totalItems={productQuery.data.length}
                    pageSize={productPageSize}
                    onPageChange={setProductPage}
                    onPageSizeChange={(s) => {
                      setProductPageSize(s)
                      setProductPage(1)
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Category Sales Report */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Category sales amounts are based on item line-totals before sale-level discounts. Cancelled sales are excluded.
            </span>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Sales distribution by product category</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {categoryQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={3} />
                </div>
              ) : categoryQuery.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    message={`Error loading category report: ${getErrorMessage(categoryQuery.error)}`}
                    onRetry={() => categoryQuery.refetch()}
                  />
                </div>
              ) : !categoryQuery.data?.length ? (
                <div className="p-6">
                  <EmptyState
                    title="No category sales found for this range"
                    description="No completed category sales exist in the specified date range."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Gross Item Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryQuery.data.map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell className="font-medium text-slate-900">
                          {row.categoryName}
                        </TableCell>
                        <TableCell className="text-right text-slate-800 font-medium">
                          {row.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(row.salesAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Payment Methods Report */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
            <span>
              Payment method revenue reflects completed sale grand totals. Zero-total sales without a payment method are omitted.
            </span>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sales by Payment Tender</CardTitle>
                <CardDescription>Breakdown of revenue and transaction volume by payment channel</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {paymentQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={3} />
                </div>
              ) : paymentQuery.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    message={`Error loading payment report: ${getErrorMessage(paymentQuery.error)}`}
                    onRetry={() => paymentQuery.refetch()}
                  />
                </div>
              ) : !paymentQuery.data?.length ? (
                <div className="p-6">
                  <EmptyState
                    title="No payment-method sales found for this range"
                    description="No completed sales with payment records exist in the specified date range."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Completed Sales Count</TableHead>
                      <TableHead className="text-right">Total Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentQuery.data.map((row) => (
                      <TableRow key={row.paymentMethod}>
                        <TableCell className="font-medium text-slate-900">
                          {paymentLabel(row.paymentMethod)}
                        </TableCell>
                        <TableCell className="text-right text-slate-800 font-medium">
                          {row.salesCount}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(row.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Cancelled Sales Report */}
      {activeTab === 'cancelled' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>
              Date range filtering applies to the original Sale Date, not the cancellation timestamp. All cancelled quantities have been restored to inventory.
            </span>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cancelled Sales Audit</CardTitle>
                <CardDescription>
                  Historical ledger of voided or returned sale transactions
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {cancelledQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={5} cols={7} />
                </div>
              ) : cancelledQuery.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    message={`Error loading cancelled sales report: ${getErrorMessage(cancelledQuery.error)}`}
                    onRetry={() => cancelledQuery.refetch()}
                  />
                </div>
              ) : !cancelledQuery.data?.length ? (
                <div className="p-6">
                  <EmptyState
                    title="No cancelled sales found for this range"
                    description="No sales matching the date criteria have been cancelled."
                  />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale Number</TableHead>
                        <TableHead>Sale Date</TableHead>
                        <TableHead>Grand Total</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Cancelled By</TableHead>
                        <TableHead>Cancelled Timestamp</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cancelledQuery.data
                        .slice((cancelledPage - 1) * cancelledPageSize, cancelledPage * cancelledPageSize)
                        .map((row) => {
                          const reasonLabel =
                            cancellationOptions.find((o) => o.value === row.cancellationReason)?.label ??
                            row.cancellationReason

                          return (
                            <TableRow key={row.saleId}>
                              <TableCell>
                                <Link
                                  to={`/sales/${row.saleId}`}
                                  className="font-semibold text-blue-700 hover:underline"
                                >
                                  {row.saleNumber}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(row.saleDate)}</TableCell>
                              <TableCell className="font-semibold text-slate-900">
                                {formatINR(row.grandTotal)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Badge variant="danger">{reasonLabel}</Badge>
                                  {row.cancellationDescription && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={row.cancellationDescription}>
                                      {row.cancellationDescription}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {row.cancelledBy || '—'}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {formatDateTime(row.cancelledAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link to={`/sales/${row.saleId}`}>
                                  <Button size="sm" variant="ghost">
                                    View Sale
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>

                  <Pagination
                    currentPage={cancelledPage}
                    totalPages={Math.max(1, Math.ceil(cancelledQuery.data.length / cancelledPageSize))}
                    totalItems={cancelledQuery.data.length}
                    pageSize={cancelledPageSize}
                    onPageChange={setCancelledPage}
                    onPageSizeChange={(s) => {
                      setCancelledPageSize(s)
                      setCancelledPage(1)
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
