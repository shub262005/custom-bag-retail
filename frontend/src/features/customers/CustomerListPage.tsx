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
import { formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { useCustomers } from './useCustomers'
import { CustomerFormModal } from './CustomerFormModal'
import { RecordRepaymentModal } from './RecordRepaymentModal'
import type { CustomerResponse } from '../../types'
import {
  Users,
  Search,
  Plus,
  RotateCcw,
  CreditCard,
  Edit2,
  Eye,
  IndianRupee,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

export const CustomerListPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null)

  const [repaymentTarget, setRepaymentTarget] = useState<CustomerResponse | null>(null)
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false)

  const { data: customers = [], isLoading, isError, error, refetch } = useCustomers({
    search: debouncedSearch,
    status: statusFilter,
  })

  const hasActiveFilters = Boolean(searchInput || statusFilter)

  const handleResetFilters = () => {
    setSearchInput('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  // Summary Metrics
  const totalCustomersCount = customers.length
  const totalOutstandingDue = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalDueAmount || 0), 0),
    [customers]
  )
  const totalRepaidAmount = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalRepaidAmount || 0), 0),
    [customers]
  )
  const customersWithDueCount = useMemo(
    () => customers.filter((c) => (c.totalDueAmount || 0) > 0).length,
    [customers]
  )

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize))
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return customers.slice(startIndex, startIndex + pageSize)
  }, [customers, currentPage, pageSize])

  const openAddModal = () => {
    setEditingCustomer(null)
    setIsFormModalOpen(true)
  }

  const openEditModal = (cust: CustomerResponse) => {
    setEditingCustomer(cust)
    setIsFormModalOpen(true)
  }

  const openRepaymentModal = (cust: CustomerResponse) => {
    setRepaymentTarget(cust)
    setIsRepaymentModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer accounts, contact information, and ledger credit dues."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Customers' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/sales/due-payments">
              <Button size="sm" variant="secondary" leftIcon={<AlertCircle className="w-3.5 h-3.5" />}>
                View Due Payments
              </Button>
            </Link>
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAddModal}>
              New Customer
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Customer Metrics">
        <StatCard
          title="Total Customers"
          value={totalCustomersCount}
          subtitle="Registered accounts"
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Total Outstanding Due"
          value={formatINR(totalOutstandingDue)}
          subtitle={`${customersWithDueCount} customer(s) with pending dues`}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
        />
        <StatCard
          title="Total Repaid"
          value={formatINR(totalRepaidAmount)}
          subtitle="Collected from customer credit"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Due Accounts Ratio"
          value={totalCustomersCount ? `${Math.round((customersWithDueCount / totalCustomersCount) * 100)}%` : '0%'}
          subtitle="Customers with active balance"
          icon={<IndianRupee className="w-5 h-5 text-amber-600" />}
        />
      </section>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          {/* Search Input */}
          <div className="flex flex-col gap-1 text-left sm:col-span-2">
            <label htmlFor="customer-search" className="block text-xs font-semibold text-slate-700">
              Search Customer
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="customer-search"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by customer name, phone number or email..."
                className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="customer-status-filter" className="block text-xs font-semibold text-slate-700">
              Account Status
            </label>
            <select
              id="customer-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-md border border-slate-300 text-sm text-slate-900 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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

      {/* Main Table Content */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : isError ? (
        <ErrorAlert
          title="Failed to load customers"
          message={getErrorMessage(error)}
          onRetry={refetch}
        />
      ) : customers.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Search className="w-6 h-6 text-slate-400" />}
            title="No customers match your search criteria."
            description="Try adjusting your search query or status filter."
            action={
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="w-6 h-6 text-slate-400" />}
            title="No customers found."
            description="Add your first customer account to track purchases and due payments."
            action={
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAddModal}>
                + Add Customer
              </Button>
            }
          />
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead className="w-36">Phone</TableHead>
                <TableHead>Email / Address</TableHead>
                <TableHead className="w-32 text-right">Total Purchases</TableHead>
                <TableHead className="w-32 text-right">Total Repaid</TableHead>
                <TableHead className="w-32 text-right">Current Due</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((cust) => {
                const hasDue = (cust.totalDueAmount || 0) > 0

                return (
                  <TableRow key={cust.id}>
                    {/* Name */}
                    <TableCell className="font-semibold text-slate-900">
                      <Link
                        to={`/customers/${cust.id}`}
                        className="hover:underline text-blue-600 hover:text-blue-800"
                      >
                        {cust.name}
                      </Link>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="font-mono text-xs text-slate-700">
                      {cust.phone}
                    </TableCell>

                    {/* Email / Address */}
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {cust.email || cust.address || '—'}
                    </TableCell>

                    {/* Total Purchases */}
                    <TableCell className="text-right">
                      <div className="font-semibold text-slate-900">{formatINR(cust.totalPurchasesAmount)}</div>
                      <div className="text-[11px] text-slate-400">{cust.totalPurchasesCount || 0} order(s)</div>
                    </TableCell>

                    {/* Total Repaid */}
                    <TableCell className="text-right text-emerald-700 font-medium">
                      {formatINR(cust.totalRepaidAmount || 0)}
                    </TableCell>

                    {/* Outstanding Due */}
                    <TableCell className="text-right">
                      {hasDue ? (
                        <span className="font-bold text-red-600">{formatINR(cust.totalDueAmount)}</span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">₹0.00</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge variant={cust.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {cust.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasDue && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openRepaymentModal(cust)}
                            className="px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            title="Record Repayment"
                            leftIcon={<CreditCard className="w-3 h-3" />}
                          >
                            Repay
                          </Button>
                        )}
                        <Link to={`/customers/${cust.id}`} title="View Details / Ledger">
                          <Button size="sm" variant="ghost" className="p-1.5 text-slate-600 hover:text-slate-900">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-slate-600 hover:text-blue-600"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
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
            totalItems={customers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        customer={editingCustomer}
        onSuccess={() => refetch()}
      />

      {/* Record Repayment Modal */}
      {repaymentTarget && (
        <RecordRepaymentModal
          isOpen={isRepaymentModalOpen}
          onClose={() => {
            setIsRepaymentModalOpen(false)
            setRepaymentTarget(null)
          }}
          customerId={repaymentTarget.id}
          customerName={repaymentTarget.name}
          customerPhone={repaymentTarget.phone}
          maxDueAmount={repaymentTarget.totalDueAmount || 0}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
