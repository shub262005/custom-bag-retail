import React, { useState, useMemo } from 'react'
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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Pagination } from '../../components/ui/Pagination'
import { SupplierFormModal } from './SupplierFormModal'
import { useSuppliers } from './useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../api/errorParser'
import {
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Truck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import type { SupplierResponse, SupplierStatus } from '../../types'

export const SupplierListPage: React.FC = () => {
  const toast = useToast()

  // Search and status filter state
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | ''>('')

  // Query hook passing debounced search and status
  const {
    suppliersQuery,
    isSearching,
    updateSupplierStatusMutation,
  } = useSuppliers({
    status: statusFilter,
    searchQuery: debouncedSearch,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierResponse | null>(null)

  // Deactivation confirmation dialog state
  const [supplierToDeactivate, setSupplierToDeactivate] = useState<SupplierResponse | null>(null)

  const handleOpenCreateModal = () => {
    setSupplierToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (supplier: SupplierResponse) => {
    setSupplierToEdit(supplier)
    setIsFormModalOpen(true)
  }

  // Deactivation requires confirmation
  const handlePromptDeactivate = (supplier: SupplierResponse) => {
    setSupplierToDeactivate(supplier)
  }

  const handleConfirmDeactivate = async () => {
    if (!supplierToDeactivate) return

    try {
      await updateSupplierStatusMutation.mutateAsync({
        id: supplierToDeactivate.id,
        status: 'INACTIVE',
      })
      toast.success(`Supplier "${supplierToDeactivate.name}" deactivated`)
      setSupplierToDeactivate(null)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  // Activation does not require destructive confirmation
  const handleDirectActivate = async (supplier: SupplierResponse) => {
    try {
      await updateSupplierStatusMutation.mutateAsync({
        id: supplier.id,
        status: 'ACTIVE',
      })
      toast.success(`Supplier "${supplier.name}" activated`)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  // Client-side pagination over retrieved supplier list
  const suppliers = suppliersQuery.data || []
  const totalItems = suppliers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return suppliers.slice(startIndex, startIndex + pageSize)
  }, [suppliers, currentPage, pageSize])

  // Reset to page 1 on filter or search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setCurrentPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (status: SupplierStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier profiles, contact numbers, GST credentials, and active statuses."
        actions={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Supplier</span>
          </Button>
        }
      />

      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with 300ms debounce */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by supplier name, GST, phone, or email..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-md placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden lg:inline">Status:</span>
          <button
            onClick={() => handleStatusFilterChange('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === ''
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilterChange('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusFilterChange('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-200 text-slate-800 border border-slate-300 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {suppliersQuery.isError ? (
          <div className="p-6">
            <ErrorAlert
              title="Failed to load suppliers"
              message={getErrorMessage(suppliersQuery.error)}
              onRetry={() => suppliersQuery.refetch()}
            />
          </div>
        ) : suppliersQuery.isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} cols={6} />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-8">
            {isSearching || statusFilter ? (
              <EmptyState
                icon={<Search className="w-10 h-10 text-slate-400" />}
                title="No matching suppliers"
                description="No suppliers found matching your current search or status filter."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput('')
                      setStatusFilter('')
                    }}
                  >
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Truck className="w-10 h-10 text-slate-400" />}
                title="No suppliers found"
                description="Get started by adding your first supplier to track vendor contacts and purchases."
                action={
                  <Button variant="primary" onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Supplier
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Supplier</TableHead>
                  <TableHead className="w-40">GST Number</TableHead>
                  <TableHead className="w-56">Phone Numbers</TableHead>
                  <TableHead className="w-56">Email Addresses</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    {/* Supplier Name & Address */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-900 leading-snug">
                          {supplier.name}
                        </span>
                        {supplier.address ? (
                          <span
                            className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1"
                            title={supplier.address}
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {supplier.address}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No address provided</span>
                        )}
                      </div>
                    </TableCell>

                    {/* GST Number */}
                    <TableCell>
                      {supplier.gstNumber ? (
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {supplier.gstNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not registered</span>
                      )}
                    </TableCell>

                    {/* Phones */}
                    <TableCell>
                      {supplier.phones && supplier.phones.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {supplier.phones.map((phone) => (
                            <div
                              key={phone.id}
                              className="text-xs text-slate-700 flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono">{phone.phoneNumber}</span>
                              {phone.label && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded border border-slate-200">
                                  {phone.label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </TableCell>

                    {/* Emails */}
                    <TableCell>
                      {supplier.emails && supplier.emails.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {supplier.emails.map((email) => (
                            <div
                              key={email.id}
                              className="text-xs text-slate-700 flex items-center gap-1.5"
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]" title={email.email}>
                                {email.email}
                              </span>
                              {email.label && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded border border-slate-200">
                                  {email.label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge variant={supplier.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {supplier.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(supplier)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {supplier.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromptDeactivate(supplier)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Deactivate supplier"
                            isLoading={
                              updateSupplierStatusMutation.isPending &&
                              supplierToDeactivate?.id === supplier.id
                            }
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDirectActivate(supplier)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Activate supplier"
                            isLoading={
                              updateSupplierStatusMutation.isPending &&
                              supplierToDeactivate?.id === supplier.id
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="px-4 py-3 border-t border-slate-200">
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
          </>
        )}
      </div>

      {/* Supplier Create / Edit Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        supplierToEdit={supplierToEdit}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!supplierToDeactivate}
        title="Deactivate Supplier?"
        message={
          supplierToDeactivate
            ? `Are you sure you want to deactivate "${supplierToDeactivate.name}"? Inactive suppliers cannot be selected for new purchase orders.`
            : ''
        }
        confirmLabel="Deactivate Supplier"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={updateSupplierStatusMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setSupplierToDeactivate(null)}
      />
    </div>
  )
}
