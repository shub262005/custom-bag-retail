import React, { useState } from 'react'
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
import { BrandFormModal } from './BrandFormModal'
import { useBrands } from './useBrands'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { Plus, Edit2, CheckCircle2, XCircle, Tag } from 'lucide-react'
import type { BrandResponse, BrandStatus } from '../../types'

export const BrandListPage: React.FC = () => {
  const toast = useToast()

  // Filter state (All, Active, Inactive)
  const [statusFilter, setStatusFilter] = useState<BrandStatus | ''>('')

  // Query hook passing status if filtered
  const { brandsQuery, updateBrandStatusMutation } = useBrands(
    statusFilter ? (statusFilter as BrandStatus) : undefined
  )

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null)

  // Confirmation dialog state for deactivation/activation
  const [actionBrand, setActionBrand] = useState<BrandResponse | null>(null)
  const [nextStatus, setNextStatus] = useState<BrandStatus | null>(null)

  const handleOpenCreateModal = () => {
    setBrandToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (brand: BrandResponse) => {
    setBrandToEdit(brand)
    setIsFormModalOpen(true)
  }

  const handlePromptStatusChange = (brand: BrandResponse, targetStatus: BrandStatus) => {
    setActionBrand(brand)
    setNextStatus(targetStatus)
  }

  const handleConfirmStatusChange = async () => {
    if (!actionBrand || !nextStatus) return

    try {
      await updateBrandStatusMutation.mutateAsync({
        id: actionBrand.id,
        status: nextStatus,
      })
      toast.success(
        `Brand "${actionBrand.name}" ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`
      )
      setActionBrand(null)
      setNextStatus(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const brands = brandsQuery.data || []
  const isStatusMutating = updateBrandStatusMutation.isPending

  return (
    <div>
      <PageHeader
        title="Brands"
        description="Manage bag brands, labels, and manufacturers such as Wildcraft, American Tourister, and Safari."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Products', href: '/products' },
          { label: 'Brands' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Brand
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Status:
          </span>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 text-xs font-medium border rounded-l-md transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium border-t border-b transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium border rounded-r-md transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Total: <strong className="text-slate-800">{brands.length}</strong>
        </span>
      </div>

      {/* Query State Views */}
      {brandsQuery.isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : brandsQuery.isError ? (
        <ErrorAlert
          title="Failed to load brands"
          message={getErrorMessage(brandsQuery.error)}
          onRetry={() => brandsQuery.refetch()}
        />
      ) : brands.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-8 h-8 text-slate-400" />}
          title={statusFilter ? `No ${statusFilter.toLowerCase()} brands found` : 'No brands created yet'}
          description="Register brands to categorize products by manufacturer or product label."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add First Brand
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Created Date</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => {
              const isActive = brand.status === 'ACTIVE'

              return (
                <TableRow key={brand.id}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    #{brand.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {brand.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isActive ? 'success' : 'neutral'}
                      dot
                      size="sm"
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(brand.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenEditModal(brand)}
                        leftIcon={<Edit2 className="w-3 h-3 text-slate-500" />}
                        className="py-1 px-2.5 text-xs"
                      >
                        Edit
                      </Button>

                      {isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePromptStatusChange(brand, 'INACTIVE')}
                          leftIcon={<XCircle className="w-3 h-3 text-red-500" />}
                          className="py-1 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Deactivate Brand"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePromptStatusChange(brand, 'ACTIVE')}
                          leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          className="py-1 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Activate Brand"
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Form Modal */}
      <BrandFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setBrandToEdit(null)
        }}
        brandToEdit={brandToEdit}
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        isOpen={!!actionBrand && !!nextStatus}
        title={nextStatus === 'INACTIVE' ? 'Deactivate Brand' : 'Activate Brand'}
        message={
          nextStatus === 'INACTIVE'
            ? `Are you sure you want to deactivate "${actionBrand?.name}"? Inactive brands cannot be assigned to new products. Existing products with this brand will remain unchanged.`
            : `Activate "${actionBrand?.name}"? This brand will immediately become available for assignment to products.`
        }
        confirmLabel={nextStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        isDestructive={nextStatus === 'INACTIVE'}
        isLoading={isStatusMutating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setActionBrand(null)
          setNextStatus(null)
        }}
      />
    </div>
  )
}
