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
import { ProductFormModal } from './ProductFormModal'
import { useProducts } from './useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { Plus, Edit2, CheckCircle2, XCircle, Search, X, Package } from 'lucide-react'
import type { ProductResponse, ProductStatus } from '../../types'

export const ProductListPage: React.FC = () => {
  const toast = useToast()

  // Search and status filter state
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')

  // Query hook passing debounced search and status
  const {
    productsQuery,
    isSearching,
    updateProductStatusMutation,
  } = useProducts({
    status: statusFilter,
    searchQuery: debouncedSearch,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<ProductResponse | null>(null)

  // Status confirmation dialog state
  const [actionProduct, setActionProduct] = useState<ProductResponse | null>(null)
  const [nextStatus, setNextStatus] = useState<ProductStatus | null>(null)

  const handleOpenCreateModal = () => {
    setProductToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (product: ProductResponse) => {
    setProductToEdit(product)
    setIsFormModalOpen(true)
  }

  const handlePromptStatusChange = (product: ProductResponse, targetStatus: ProductStatus) => {
    setActionProduct(product)
    setNextStatus(targetStatus)
  }

  const handleConfirmStatusChange = async () => {
    if (!actionProduct || !nextStatus) return

    try {
      await updateProductStatusMutation.mutateAsync({
        id: actionProduct.id,
        status: nextStatus,
      })
      toast.success(
        `Product "${actionProduct.name}" ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`
      )
      setActionProduct(null)
      setNextStatus(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const rawProducts = productsQuery.data || []

  // If searching on backend, but user also selected status filter, apply status filter in-memory on the search result
  const filteredProducts = useMemo(() => {
    if (isSearching && statusFilter) {
      return rawProducts.filter((p) => p.status === statusFilter)
    }
    return rawProducts
  }, [rawProducts, isSearching, statusFilter])

  // Client-side pagination over retrieved list
  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const isStatusMutating = updateProductStatusMutation.isPending

  return (
    <div>
      <PageHeader
        title="Products"
        description="Master catalog of bag products, pricing, barcode references, and stock thresholds."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Products' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Product
          </Button>
        }
      />

      {/* Toolbar: Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Backend Search Input (debounced) */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full text-xs bg-white border border-slate-300 rounded-md pl-8 pr-8 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status:
            </span>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('')
                  setCurrentPage(1)
                }}
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
                onClick={() => {
                  setStatusFilter('ACTIVE')
                  setCurrentPage(1)
                }}
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
                onClick={() => {
                  setStatusFilter('INACTIVE')
                  setCurrentPage(1)
                }}
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

          <span className="text-xs text-slate-500 hidden md:inline">
            Total: <strong className="text-slate-800">{totalItems}</strong>
          </span>
        </div>
      </div>

      {/* Query State Views */}
      {productsQuery.isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : productsQuery.isError ? (
        <ErrorAlert
          title="Failed to load products"
          message={getErrorMessage(productsQuery.error)}
          onRetry={() => productsQuery.refetch()}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400" />}
          title={
            debouncedSearch
              ? `No products matching "${debouncedSearch}"`
              : statusFilter
              ? `No ${statusFilter.toLowerCase()} products found`
              : 'No products in catalog'
          }
          description={
            debouncedSearch
              ? 'Try searching with a different SKU, barcode, or product keyword.'
              : 'Add your first bag product to start managing prices and tracking inventory.'
          }
          action={
            debouncedSearch ? (
              <Button size="sm" variant="secondary" onClick={() => setSearchInput('')}>
                Clear Search
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Product
              </Button>
            )
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-36">SKU / Barcode</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-28">Brand</TableHead>
                <TableHead className="w-28 text-right">Selling Price</TableHead>
                <TableHead className="w-36 text-center">Stock Level</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => {
                const isActive = product.status === 'ACTIVE'
                const isOutOfStock = product.stockQuantity === 0
                const isLowStock =
                  product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock

                return (
                  <TableRow key={product.id}>
                    {/* Thumbnail */}
                    <TableCell className="text-center p-2">
                      <div className="w-9 h-9 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden mx-auto">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Replace broken image with fallback icon
                              ;(e.currentTarget as HTMLElement).style.display = 'none'
                              e.currentTarget.parentElement?.classList.add('fallback-icon')
                            }}
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </TableCell>

                    {/* Product Name + Attributes */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {product.name}
                        </span>
                        {(product.color || product.capacity) && (
                          <span className="text-[11px] text-slate-500">
                            {[product.color, product.capacity].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* SKU & Barcode */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-mono font-medium text-slate-800">{product.sku}</span>
                        {product.barcode ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            {product.barcode}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No barcode</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {product.category ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Brand */}
                    <TableCell>
                      {product.brand ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {product.brand.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unbranded</span>
                      )}
                    </TableCell>

                    {/* Selling Price */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {formatINR(product.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Cost: {formatINR(product.purchasePrice)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Authoritative Stock Level (Read-Only) */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {isOutOfStock ? (
                          <Badge variant="danger" size="sm" dot>
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" size="sm" dot>
                            Low: {product.stockQuantity}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            {product.stockQuantity} in stock
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Min: {product.minimumStock}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenEditModal(product)}
                          leftIcon={<Edit2 className="w-3 h-3 text-slate-500" />}
                          className="py-1 px-2.5 text-xs"
                          title="Edit Product Details"
                        >
                          Edit
                        </Button>

                        {isActive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePromptStatusChange(product, 'INACTIVE')}
                            leftIcon={<XCircle className="w-3 h-3 text-red-500" />}
                            className="py-1 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Deactivate Product"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePromptStatusChange(product, 'ACTIVE')}
                            leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            className="py-1 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Activate Product"
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

          {/* Client-side Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      {/* Create / Edit Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setProductToEdit(null)
        }}
        productToEdit={productToEdit}
      />

      {/* Confirmation Dialog for Product Status Update */}
      <ConfirmDialog
        isOpen={!!actionProduct && !!nextStatus}
        title={nextStatus === 'INACTIVE' ? 'Deactivate Product' : 'Activate Product'}
        message={
          nextStatus === 'INACTIVE'
            ? `Are you sure you want to deactivate "${actionProduct?.name}"? Inactive products cannot be added to new retail sales or purchase orders. Existing inventory and historical sales records will remain preserved.`
            : `Activate "${actionProduct?.name}"? This product will immediately be available for sales register billing and purchase orders.`
        }
        confirmLabel={nextStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        isDestructive={nextStatus === 'INACTIVE'}
        isLoading={isStatusMutating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setActionProduct(null)
          setNextStatus(null)
        }}
      />
    </div>
  )
}
