import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { SkeletonTable } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Pagination } from '../../components/ui/Pagination'
import { InventoryTransactionModal } from './InventoryTransactionModal'
import { useInventoryTransactions } from './useInventory'
import { useProducts } from '../products/useProducts'
import {
  History,
  ArrowLeft,
  Plus,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react'
import type { TransactionType, InventoryTransactionFilterParams } from '../../types'

export const InventoryHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read URL query params if user clicked "View History" from a specific product
  const initialProductId = searchParams.get('productId') || ''

  // Filter States
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId)
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Sync state if URL query param changes
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId)
    }
  }, [initialProductId])

  // Products for dropdown filter
  const { productsQuery } = useProducts()
  const products = productsQuery.data || []

  // Construct backend filter params
  const filterParams: InventoryTransactionFilterParams = useMemo(() => {
    const params: InventoryTransactionFilterParams = {}
    if (selectedProductId) {
      params.productId = Number(selectedProductId)
    }
    if (selectedType) {
      params.transactionType = selectedType
    }
    if (startDate) {
      params.startDate = `${startDate}T00:00:00`
    }
    if (endDate) {
      params.endDate = `${endDate}T23:59:59`
    }
    return params
  }, [selectedProductId, selectedType, startDate, endDate])

  // Query transactions from backend
  const { data: rawTransactions, isLoading, isError, refetch } = useInventoryTransactions(filterParams)
  const transactions = rawTransactions || []

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const totalPages = Math.ceil(transactions.length / pageSize) || 1
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return transactions.slice(start, start + pageSize)
  }, [transactions, currentPage, pageSize])

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClearFilters = () => {
    setSelectedProductId('')
    setSelectedType('')
    setStartDate('')
    setEndDate('')
    setSearchParams({})
    setCurrentPage(1)
  }

  const hasActiveFilters =
    selectedProductId !== '' || selectedType !== '' || startDate !== '' || endDate !== ''

  // Helper date-time formatter
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Transaction History"
        description="Immutable audit trail of all warehouse stock movements, receipts, and manual count reconciliations."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Inventory', href: '/inventory' },
          { label: 'History' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => navigate('/inventory')}
              leftIcon={<ArrowLeft className="w-4 h-4 text-slate-600" />}
            >
              Stock Overview
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Movement
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Product Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Product:</span>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  if (e.target.value) {
                    setSearchParams({ productId: e.target.value })
                  } else {
                    setSearchParams({})
                  }
                  setCurrentPage(1)
                }}
                className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 max-w-[200px] truncate focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.sku}]
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as TransactionType | '')
                  setCurrentPage(1)
                }}
                className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                title="From Date"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                title="To Date"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={handleClearFilters}>
              <X className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Query Error Display */}
      {isError && (
        <ErrorAlert
          title="Failed to Load History"
          message="Could not load transaction logs from the server. Please check your connection."
          onRetry={() => refetch()}
        />
      )}

      {/* Transactions Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable cols={7} rows={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8 text-slate-400" />}
            title={hasActiveFilters ? 'No Matching Transactions' : 'No Transactions Recorded'}
            description={
              hasActiveFilters
                ? 'No inventory movements match the selected filters.'
                : 'Stock movements such as restocks, dispatches, and adjustments will appear here.'
            }
            action={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Date &amp; Time</TableHead>
                  <TableHead className="w-[260px]">Product</TableHead>
                  <TableHead className="text-center w-[130px]">Movement</TableHead>
                  <TableHead className="text-center w-[120px]">Quantity</TableHead>
                  <TableHead className="text-center w-[160px]">Stock Transition</TableHead>
                  <TableHead className="w-[180px]">Reference</TableHead>
                  <TableHead>Reason / Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => {
                  const isStockIn = tx.transactionType === 'STOCK_IN'
                  const isStockOut = tx.transactionType === 'STOCK_OUT'
                  const isAdjustment = tx.transactionType === 'ADJUSTMENT'

                  return (
                    <TableRow key={tx.id}>
                      {/* Date & Time */}
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-800">
                            {tx.movementDate || tx.createdAt?.split('T')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(tx.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Product Name & SKU */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 text-xs sm:text-sm leading-tight">
                            {tx.productName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 mt-0.5">
                            SKU: {tx.productSku}
                          </span>
                        </div>
                      </TableCell>

                      {/* Movement Type Badge */}
                      <TableCell className="text-center">
                        {isStockIn && (
                          <Badge variant="success" size="sm">
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                            STOCK IN
                          </Badge>
                        )}
                        {isStockOut && (
                          <Badge variant="danger" size="sm">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            STOCK OUT
                          </Badge>
                        )}
                        {isAdjustment && (
                          <Badge variant="info" size="sm">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            ADJUSTMENT
                          </Badge>
                        )}
                      </TableCell>

                      {/* Quantity Moved / Recorded */}
                      <TableCell className="text-center">
                        <span
                          className={`font-bold text-sm ${
                            isStockIn
                              ? 'text-emerald-700'
                              : isStockOut
                              ? 'text-red-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {isStockIn && `+${tx.quantity}`}
                          {isStockOut && `-${tx.quantity}`}
                          {isAdjustment && `Δ ${tx.quantity}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </TableCell>

                      {/* Authoritative Stock Transition */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                          <span className="text-slate-500 font-medium">{tx.quantityBefore}</span>
                          <span className="text-slate-400 font-bold">→</span>
                          <span className="font-bold text-slate-900">{tx.quantityAfter}</span>
                        </div>
                      </TableCell>

                      {/* Reference */}
                      <TableCell>
                        {tx.referenceType || tx.referenceId ? (
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-slate-700">
                              {tx.referenceType || 'REF'}
                            </span>
                            {tx.referenceId && (
                              <span className="font-mono text-[11px] text-slate-500">
                                #{tx.referenceId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Reason / Notes */}
                      <TableCell>
                        {tx.reason ? (
                          <span className="text-xs text-slate-700 leading-snug">{tx.reason}</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No note provided</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!isLoading && transactions.length > 0 && (
          <div className="p-3 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={transactions.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
            />
          </div>
        )}
      </div>

      {/* Inventory Transaction Modal */}
      <InventoryTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
