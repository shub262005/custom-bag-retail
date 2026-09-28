import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  Receipt,
  Boxes,
  Package,
  IndianRupee,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ArrowRight,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Skeleton, SkeletonTable } from '../../components/ui/Skeleton'
import { useSalesDashboard } from './useDashboard'
import { useProducts } from '../products/useProducts'
import { localToday, paymentLabel } from '../sales/saleForm'
import { formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'

export const DashboardView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(localToday())
  const isToday = selectedDate === localToday()

  const dashboardQuery = useSalesDashboard(selectedDate)
  const { productsQuery } = useProducts()

  const rawProducts = useMemo(() => productsQuery.data || [], [productsQuery.data])

  // Derive inventory statistics from active products
  const inventoryStats = useMemo(() => {
    const total = rawProducts.length
    const active = rawProducts.filter((p) => p.status === 'ACTIVE')
    let lowStock = 0
    let outOfStock = 0

    const attentionList = active.filter((p) => {
      const qty = p.stockQuantity ?? 0
      const min = p.minimumStock ?? 0
      if (qty <= 0) {
        outOfStock++
        return true
      }
      if (qty <= min) {
        lowStock++
        return true
      }
      return false
    })

    // Sort: Out of stock first, then ascending stockQuantity
    attentionList.sort((a, b) => {
      const aQty = a.stockQuantity ?? 0
      const bQty = b.stockQuantity ?? 0
      const aOut = aQty <= 0
      const bOut = bQty <= 0
      if (aOut && !bOut) return -1
      if (!aOut && bOut) return 1
      return aQty - bQty
    })

    return {
      totalProducts: total,
      activeProducts: active.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      attentionProducts: attentionList.slice(0, 6),
      totalAttentionCount: attentionList.length,
    }
  }, [rawProducts])

  const handleRefresh = () => {
    void dashboardQuery.refetch()
    void productsQuery.refetch()
  }

  const isRefreshing = dashboardQuery.isFetching || productsQuery.isFetching
  const dashboard = dashboardQuery.data

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description={
            isToday
              ? "Overview of today's sales and current inventory health."
              : `Sales metrics for ${selectedDate} and current inventory health.`
          }
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
        />

        {/* Date Filter & Refresh Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              aria-label="Dashboard date"
              className="text-xs text-slate-700 bg-transparent focus:outline-hidden"
              value={selectedDate}
              max={localToday()}
              onChange={(e) => setSelectedDate(e.target.value || localToday())}
            />
          </div>

          {!isToday && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedDate(localToday())}
              title="Reset to today"
            >
              Today
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Refresh dashboard data"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alerts */}
      {dashboardQuery.isError && (
        <ErrorAlert
          message={`Sales Dashboard error: ${getErrorMessage(dashboardQuery.error)}`}
          onRetry={() => dashboardQuery.refetch()}
        />
      )}
      {productsQuery.isError && (
        <ErrorAlert
          message={`Products data error: ${getErrorMessage(productsQuery.error)}`}
          onRetry={() => productsQuery.refetch()}
        />
      )}

      {/* Quick Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Quick Actions
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/sales/pos">
            <Button size="sm" variant="primary" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
              New Sale (POS)
            </Button>
          </Link>
          <Link to="/purchases/new">
            <Button size="sm" variant="secondary" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
              New Purchase
            </Button>
          </Link>
          <Link to="/inventory">
            <Button size="sm" variant="secondary" leftIcon={<Boxes className="w-3.5 h-3.5" />}>
              Stock Overview
            </Button>
          </Link>
          <Link to="/products">
            <Button size="sm" variant="secondary" leftIcon={<Package className="w-3.5 h-3.5" />}>
              Product Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <section aria-label="Key Performance Indicators">
        {dashboardQuery.isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-2.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isToday ? "Today's Sales" : 'Sales Amount'}
              value={formatINR(dashboard?.todayCompletedSalesAmount ?? 0)}
              subtitle={`${dashboard?.todayCompletedSalesCount ?? 0} completed transaction${
                dashboard?.todayCompletedSalesCount === 1 ? '' : 's'
              }`}
              icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Completed Sales"
              value={dashboard?.todayCompletedSalesCount ?? 0}
              subtitle="Orders processed"
              icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
            />

            <StatCard
              title="Cancelled Sales"
              value={dashboard?.todayCancelledSalesCount ?? 0}
              subtitle="Cancelled orders"
              icon={<XCircle className="w-5 h-5 text-red-600" />}
            />

            <StatCard
              title="Low Stock Products"
              value={
                productsQuery.isPending
                  ? '…'
                  : inventoryStats.lowStockCount + inventoryStats.outOfStockCount
              }
              subtitle={
                productsQuery.isPending
                  ? 'Calculating…'
                  : `${inventoryStats.outOfStockCount} out of stock · ${inventoryStats.lowStockCount} low stock`
              }
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
          </div>
        )}
      </section>

      {/* Main Grid: Inventory & Sales Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inventory Overview & Attention Items */}
        <div className="space-y-6">
          {/* Inventory Overview Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Inventory Health Overview</CardTitle>
                <CardDescription>Live catalog stock distribution</CardDescription>
              </div>
              <Link to="/inventory">
                <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Manage
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {productsQuery.isPending ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Total Products</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {inventoryStats.totalProducts}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">Active Products</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">
                      {inventoryStats.activeProducts}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">Low Stock</p>
                    <p className="text-xl font-bold text-amber-900 mt-1">
                      {inventoryStats.lowStockCount}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">Out of Stock</p>
                    <p className="text-xl font-bold text-red-900 mt-1">
                      {inventoryStats.outOfStockCount}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Attention Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Products Needing Attention</CardTitle>
                <CardDescription>
                  Items at or below minimum threshold
                </CardDescription>
              </div>
              {inventoryStats.totalAttentionCount > 0 && (
                <Badge variant={inventoryStats.outOfStockCount > 0 ? 'danger' : 'warning'}>
                  {inventoryStats.totalAttentionCount} items
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {productsQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={4} />
                </div>
              ) : inventoryStats.attentionProducts.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="All products well-stocked"
                    description="No active items are currently at or below minimum stock level."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock / Min</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryStats.attentionProducts.map((p) => {
                      const qty = p.stockQuantity ?? 0
                      const min = p.minimumStock ?? 0
                      const isOutOfStock = qty <= 0

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-slate-900">
                            {p.name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {p.sku}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <span className={isOutOfStock ? 'font-bold text-red-600' : 'font-medium text-amber-700'}>
                              {qty}
                            </span>
                            <span className="text-slate-400"> / {min}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={isOutOfStock ? 'danger' : 'warning'}>
                              {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {inventoryStats.totalAttentionCount > 6 && (
              <CardFooter>
                <Link
                  to="/inventory"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View all {inventoryStats.totalAttentionCount} attention items in Inventory
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column: Top Products & Payment Methods */}
        <div className="space-y-6">
          {/* Top Selling Products Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>
                  {isToday ? "Today's best performers" : `Top performers on ${selectedDate}`}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {dashboardQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={4} />
                </div>
              ) : !dashboard?.topSellingProducts || dashboard.topSellingProducts.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No sales recorded"
                    description={
                      isToday
                        ? 'No products have been sold yet today.'
                        : `No products were sold on ${selectedDate}.`
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.topSellingProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-medium text-slate-900">
                          {p.productName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {p.sku}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {p.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(p.salesAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sales by Payment Method Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sales by Payment Method</CardTitle>
                <CardDescription>
                  {isToday ? "Today's tender breakdown" : `Payment breakdown for ${selectedDate}`}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {dashboardQuery.isPending ? (
                <div className="p-4">
                  <SkeletonTable rows={3} cols={3} />
                </div>
              ) : !dashboard?.salesByPaymentMethod || dashboard.salesByPaymentMethod.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No payments received"
                    description={
                      isToday
                        ? 'No payment transactions recorded today.'
                        : `No payment transactions recorded for ${selectedDate}.`
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.salesByPaymentMethod.map((pm) => (
                      <TableRow key={pm.paymentMethod}>
                        <TableCell className="font-medium text-slate-900">
                          {paymentLabel(pm.paymentMethod)}
                        </TableCell>
                        <TableCell className="text-right text-slate-700">
                          {pm.salesCount}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(pm.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
