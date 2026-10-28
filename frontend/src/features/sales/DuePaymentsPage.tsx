import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useDebounce } from '../../hooks/useDebounce'
import { formatINR, formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { useDueSales } from './useSales'
import { RecordRepaymentModal } from '../customers/RecordRepaymentModal'
import type { SaleResponse } from '../../types'
import {
  AlertCircle,
  CreditCard,
  Search,
  RotateCcw,
  Users,
  Eye,
  CheckCircle,
  Phone,
  ShoppingBag,
} from 'lucide-react'

export const DuePaymentsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [onlyPending, setOnlyPending] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Repayment Modal
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null)
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false)

  const { data: sales = [], isLoading, isError, error, refetch } = useDueSales({
    search: debouncedSearch,
    onlyPending,
  })

  const hasActiveFilters = Boolean(searchInput || !onlyPending)

  const handleResetFilters = () => {
    setSearchInput('')
    setOnlyPending(true)
    setCurrentPage(1)
  }

  // Summary Metrics
  const totalOutstandingDue = useMemo(
    () => sales.reduce((sum, s) => sum + (s.dueAmount || 0), 0),
    [sales]
  )
  const totalCollectedSoFar = useMemo(
    () => sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0),
    [sales]
  )
  const pendingSalesCount = useMemo(
    () => sales.filter((s) => (s.dueAmount || 0) > 0).length,
    [sales]
  )

  // Client-side pagination
  const totalItems = sales.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sales.slice(startIndex, startIndex + pageSize)
  }, [sales, currentPage, pageSize])

  const openRepaymentModal = (sale: SaleResponse) => {
    setSelectedSale(sale)
    setIsRepaymentModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Payments"
        description="View and collect outstanding credit sales from customers."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales', href: '/sales' }, { label: 'Due Payments' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/customers">
              <Button size="sm" variant="secondary" leftIcon={<Users className="w-3.5 h-3.5" />}>
                Manage Customers
              </Button>
            </Link>
            <Link to="/sales/pos">
              <Button size="sm" variant="primary" leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                New Sale (POS)
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Due Payment Summary">
        <StatCard
          title="Total Outstanding Due"
          value={formatINR(totalOutstandingDue)}
          subtitle="Pending customer collections"
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
        />
        <StatCard
          title="Pending Due Sales"
          value={pendingSalesCount}
          subtitle="Orders awaiting full payment"
          icon={<CreditCard className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Amount Collected"
          value={formatINR(totalCollectedSoFar)}
          subtitle="Paid portion of these sales"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
      </section>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1 text-left sm:col-span-2">
            <label htmlFor="due-search" className="block text-xs font-semibold text-slate-700">
              Search by Customer or Sale
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="due-search"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search customer name, phone number, or sale number..."
                className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pending Toggle */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="status-filter-due" className="block text-xs font-semibold text-slate-700">
              Filter Status
            </label>
            <select
              id="status-filter-due"
              value={onlyPending ? 'pending' : 'all'}
              onChange={(e) => {
                setOnlyPending(e.target.value === 'pending')
                setCurrentPage(1)
              }}
              className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="pending">Pending Dues Only</option>
              <option value="all">All Credit Sales (including settled)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="w-full text-slate-600 hover:text-slate-900"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : isError ? (
        <ErrorAlert
          title="Failed to load due payments"
          message={getErrorMessage(error)}
          onRetry={refetch}
        />
      ) : sales.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Search className="w-6 h-6 text-slate-400" />}
            title="No due sales match your search."
            description="Try searching with a different customer name, phone number, or status."
            action={
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
            title="No outstanding due payments!"
            description="All customer credit sales have been settled or no due sales have been created yet."
            action={
              <Link to="/sales/pos">
                <Button size="sm" variant="primary">
                  Create New Sale
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Sale #</TableHead>
                <TableHead className="w-24">Date</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="w-36">Phone Number</TableHead>
                <TableHead className="w-28 text-right">Grand Total</TableHead>
                <TableHead className="w-28 text-right">Paid Amount</TableHead>
                <TableHead className="w-28 text-right">Remaining Due</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map((sale) => {
                const customer = sale.customer
                const due = sale.dueAmount || 0
                const hasRemainingDue = due > 0

                return (
                  <TableRow key={sale.id}>
                    {/* Sale # */}
                    <TableCell className="font-mono font-medium text-blue-600">
                      <Link to={`/sales/${sale.id}`} className="hover:underline">
                        {sale.saleNumber}
                      </Link>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-600">{formatDate(sale.saleDate)}</TableCell>

                    {/* Customer Name */}
                    <TableCell className="font-medium text-slate-900">
                      {customer ? (
                        <Link
                          to={`/customers/${customer.id}`}
                          className="hover:underline text-blue-600 hover:text-blue-800"
                        >
                          {customer.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="font-mono text-xs text-slate-700">
                      {customer?.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {customer.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    {/* Grand Total */}
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatINR(sale.grandTotal)}
                    </TableCell>

                    {/* Paid */}
                    <TableCell className="text-right text-emerald-700 font-medium">
                      {formatINR(sale.paidAmount || 0)}
                    </TableCell>

                    {/* Remaining Due */}
                    <TableCell className="text-right">
                      {hasRemainingDue ? (
                        <span className="font-bold text-red-600">{formatINR(due)}</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Cleared</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {sale.paymentStatus === 'PAID' ? (
                        <Badge variant="success">Paid</Badge>
                      ) : sale.paymentStatus === 'PARTIALLY_PAID' ? (
                        <Badge variant="warning">Partially Paid</Badge>
                      ) : (
                        <Badge variant="danger">Unpaid</Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasRemainingDue && customer && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openRepaymentModal(sale)}
                            className="px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300 font-semibold"
                            leftIcon={<CreditCard className="w-3 h-3" />}
                          >
                            Collect
                          </Button>
                        )}
                        <Link to={`/sales/${sale.id}`} title="View Sale">
                          <Button size="sm" variant="ghost" className="p-1.5 text-slate-600 hover:text-slate-900">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sales.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
        </div>
      )}

      {/* Record Repayment Modal */}
      {selectedSale && selectedSale.customer && (
        <RecordRepaymentModal
          isOpen={isRepaymentModalOpen}
          onClose={() => {
            setIsRepaymentModalOpen(false)
            setSelectedSale(null)
          }}
          customerId={selectedSale.customer.id}
          customerName={selectedSale.customer.name}
          customerPhone={selectedSale.customer.phone}
          saleId={selectedSale.id}
          saleNumber={selectedSale.saleNumber}
          maxDueAmount={selectedSale.dueAmount || 0}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
