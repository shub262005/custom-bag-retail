import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { usePurchases } from './usePurchases'
import { useSuppliers } from '../suppliers/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { formatINR, formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import type { PurchaseFilterParams, PurchaseStatus } from '../../types'
import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Filter,
  Inbox,
} from 'lucide-react'

export const PurchaseListPage: React.FC = () => {
  // Filter states
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Memoized query filter parameters for the backend
  const queryFilters: PurchaseFilterParams = useMemo(
    () => ({
      supplierId: selectedSupplierId ? Number(selectedSupplierId) : undefined,
      status: selectedStatus ? (selectedStatus as PurchaseStatus) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
    }),
    [selectedSupplierId, selectedStatus, startDate, endDate, debouncedSearch]
  )

  // Query purchases list from backend
  const { data: purchases = [], isLoading, isError, error, refetch } = usePurchases(queryFilters)

  // Query suppliers for the supplier filter dropdown
  const { suppliersQuery } = useSuppliers()
  const suppliers = suppliersQuery.data || []

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchInput || selectedSupplierId || selectedStatus || startDate || endDate
  )

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchInput('')
    setSelectedSupplierId('')
    setSelectedStatus('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Client-side pagination calculations over retrieved purchases
  const totalItems = purchases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return purchases.slice(startIndex, startIndex + pageSize)
  }, [purchases, currentPage, pageSize])

  // Helper function to map payment status badge
  const renderPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partially Paid</Badge>
      case 'UNPAID':
      default:
        return <Badge variant="neutral">Unpaid</Badge>
    }
  }

  // Helper function to map purchase status badge
  const renderPurchaseBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Purchases"
        description="Supplier procurement and stock receipts."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Purchases' }]}
        actions={
          <Link to="/purchases/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Purchase
            </Button>
          </Link>
        }
      />

      {/* Filter Controls Row */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1 text-left lg:col-span-2">
            <label htmlFor="purchase-search" className="block text-xs font-semibold text-slate-700">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="purchase-search"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search purchase number, invoice or supplier..."
                className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Supplier Dropdown */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="supplier-filter" className="block text-xs font-semibold text-slate-700">
              Supplier
            </label>
            <select
              id="supplier-filter"
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Status Dropdown */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="status-filter" className="block text-xs font-semibold text-slate-700">
              Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters Action */}
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

        {/* Second Row: Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-md border border-slate-300 text-xs text-slate-900 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-md border border-slate-300 text-xs text-slate-900 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : isError ? (
        <ErrorAlert
          title="Failed to load purchases"
          message={getErrorMessage(error)}
          onRetry={refetch}
        />
      ) : purchases.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Filter className="w-6 h-6 text-slate-400" />}
            title="No purchases match your filters."
            description="Try changing your search keywords, supplier, or date range."
            action={
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Inbox className="w-6 h-6 text-slate-400" />}
            title="No purchases found."
            description="Create your first purchase to record supplier stock intake."
            action={
              <Link to="/purchases/new">
                <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  + New Purchase
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
                <TableHead className="w-36">Purchase #</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-32">Invoice #</TableHead>
                <TableHead className="w-32 text-right">Grand Total</TableHead>
                <TableHead className="w-32 text-center">Payment</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  {/* Purchase Number */}
                  <TableCell className="font-mono font-medium text-blue-600">
                    <Link
                      to={`/purchases/${purchase.id}`}
                      className="hover:underline hover:text-blue-800"
                    >
                      {purchase.purchaseNumber}
                    </Link>
                  </TableCell>

                  {/* Purchase Date */}
                  <TableCell className="text-slate-600 text-xs">
                    {formatDate(purchase.purchaseDate)}
                  </TableCell>

                  {/* Supplier */}
                  <TableCell className="font-medium text-slate-800">
                    {purchase.supplier?.name || '—'}
                  </TableCell>

                  {/* Invoice Number */}
                  <TableCell className="text-slate-600 text-xs font-mono">
                    {purchase.invoiceNumber || '—'}
                  </TableCell>

                  {/* Grand Total */}
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatINR(purchase.grandTotal)}
                  </TableCell>

                  {/* Payment Status */}
                  <TableCell className="text-center">
                    {renderPaymentBadge(purchase.paymentStatus)}
                  </TableCell>

                  {/* Purchase Status */}
                  <TableCell className="text-center">
                    {renderPurchaseBadge(purchase.status)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Action */}
                      <Link to={`/purchases/${purchase.id}`} title="View Details">
                        <Button size="sm" variant="ghost" className="p-1.5 text-slate-600 hover:text-slate-900">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      {/* Edit Action (Only for COMPLETED purchases) */}
                      {purchase.status === 'COMPLETED' && (
                        <Link to={`/purchases/${purchase.id}/edit`} title="Edit Purchase">
                          <Button size="sm" variant="ghost" className="p-1.5 text-slate-600 hover:text-blue-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
