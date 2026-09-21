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
import { CategoryFormModal } from './CategoryFormModal'
import { useCategories } from './useCategories'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { Plus, Edit2, CheckCircle2, XCircle, FolderTree } from 'lucide-react'
import type { CategoryResponse, CategoryStatus } from '../../types'

export const CategoryListPage: React.FC = () => {
  const toast = useToast()

  // Filter state (All, Active, Inactive)
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | ''>('')

  // Query hook passing status if filtered
  const {
    categoriesQuery,
    activateCategoryMutation,
    deactivateCategoryMutation,
  } = useCategories(statusFilter ? (statusFilter as CategoryStatus) : undefined)

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryResponse | null>(null)

  // Confirmation dialog state for deactivation/activation
  const [actionCategory, setActionCategory] = useState<CategoryResponse | null>(null)
  const [actionType, setActionType] = useState<'ACTIVATE' | 'DEACTIVATE' | null>(null)

  const handleOpenCreateModal = () => {
    setCategoryToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (category: CategoryResponse) => {
    setCategoryToEdit(category)
    setIsFormModalOpen(true)
  }

  const handlePromptStatusChange = (category: CategoryResponse, action: 'ACTIVATE' | 'DEACTIVATE') => {
    setActionCategory(category)
    setActionType(action)
  }

  const handleConfirmStatusChange = async () => {
    if (!actionCategory || !actionType) return

    try {
      if (actionType === 'ACTIVATE') {
        await activateCategoryMutation.mutateAsync(actionCategory.id)
        toast.success(`Category "${actionCategory.name}" activated.`)
      } else {
        await deactivateCategoryMutation.mutateAsync(actionCategory.id)
        toast.success(`Category "${actionCategory.name}" deactivated.`)
      }
      setActionCategory(null)
      setActionType(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const categories = categoriesQuery.data || []
  const isStatusMutating =
    activateCategoryMutation.isPending || deactivateCategoryMutation.isPending

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize bag inventory into retail categories such as Travel Bags, Handbags, and Luggage."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Products', href: '/products' },
          { label: 'Categories' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Category
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
          Total: <strong className="text-slate-800">{categories.length}</strong>
        </span>
      </div>

      {/* Query State Views */}
      {categoriesQuery.isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : categoriesQuery.isError ? (
        <ErrorAlert
          title="Failed to load categories"
          message={getErrorMessage(categoriesQuery.error)}
          onRetry={() => categoriesQuery.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-8 h-8 text-slate-400" />}
          title={statusFilter ? `No ${statusFilter.toLowerCase()} categories found` : 'No categories created yet'}
          description="Categories group your bags into logical departments like Backpacks, Handbags, Luggage, and Wallets."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add First Category
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Created Date</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const isActive = category.status === 'ACTIVE'

              return (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    #{category.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {category.name}
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
                    {formatDate(category.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenEditModal(category)}
                        leftIcon={<Edit2 className="w-3 h-3 text-slate-500" />}
                        className="py-1 px-2.5 text-xs"
                      >
                        Edit
                      </Button>

                      {isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePromptStatusChange(category, 'DEACTIVATE')}
                          leftIcon={<XCircle className="w-3 h-3 text-red-500" />}
                          className="py-1 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Deactivate Category"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePromptStatusChange(category, 'ACTIVATE')}
                          leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          className="py-1 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Activate Category"
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
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setCategoryToEdit(null)
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Confirmation Dialog for Activation / Deactivation */}
      <ConfirmDialog
        isOpen={!!actionCategory && !!actionType}
        title={actionType === 'DEACTIVATE' ? 'Deactivate Category' : 'Activate Category'}
        message={
          actionType === 'DEACTIVATE'
            ? `Are you sure you want to deactivate "${actionCategory?.name}"? Inactive categories cannot be selected when adding new products. Existing products using this category will remain unchanged.`
            : `Activate "${actionCategory?.name}"? This category will immediately be available for selection on products.`
        }
        confirmLabel={actionType === 'DEACTIVATE' ? 'Deactivate' : 'Activate'}
        isDestructive={actionType === 'DEACTIVATE'}
        isLoading={isStatusMutating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setActionCategory(null)
          setActionType(null)
        }}
      />
    </div>
  )
}
