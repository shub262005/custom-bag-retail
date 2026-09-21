import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { StatCard } from '../../components/ui/StatCard'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Pagination } from '../../components/ui/Pagination'
import { InventoryTransactionModal } from './InventoryTransactionModal'
import { useProducts } from '../products/useProducts'
import { useCategories } from '../categories/useCategories'
import { useDebounce } from '../../hooks/useDebounce'
import {
  Warehouse,
  Plus,
  History,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  Boxes,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import type { ProductResponse } from '../../types'

type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export const InventoryListPage: React.FC = () => {
  const navigate = useNavigate()

  // Search and filter states
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [stockFilter, setStockFilter] = useState<StockStatusFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Query products with search support
  const { productsQuery } = useProducts({
    searchQuery: debouncedSearch,
  })

  // Categories query for category filter dropdown
  const { categoriesQuery } = useCategories()
  const categories = categoriesQuery.data || []

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Transaction Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductForTx, setSelectedProductForTx] = useState<ProductResponse | null>(null)

  const rawProducts = productsQuery.data || []

  // Compute live summary statistics from raw products
  const stats = useMemo(() => {
    let totalItems = rawProducts.length
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0

    for (const p of rawProducts) {
      const qty = p.stockQuantity ?? 0
      const min = p.minimumStock ?? 0
      if (qty <= 0) {
        outOfStock++
      } else if (qty <= min) {
        lowStock++
      } else {
        inStock++
      }
    }

    return { totalItems, inStock, lowStock, outOfStock }
  }, [rawProducts])

  // Filter products based on stockFilter and categoryFilter
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      // Category filter
      if (categoryFilter && String(p.category?.id) !== categoryFilter) {
        return false
      }

      // Stock status filter
      const qty = p.stockQuantity ?? 0
      const min = p.minimumStock ?? 0

      if (stockFilter === 'OUT_OF_STOCK' && qty > 0) return false
      if (stockFilter === 'LOW_STOCK' && (qty <= 0 || qty > min)) return false
      if (stockFilter === 'IN_STOCK' && qty <= min) return false

      return true
    })
  }, [rawProducts, stockFilter, categoryFilter])

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const handleOpenTransactionModal = (product: ProductResponse | null = null) => {
    setSelectedProductForTx(product)
    setIsModalOpen(true)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setStockFilter('ALL')
    setCategoryFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    searchInput.trim().length > 0 || stockFilter !== 'ALL' || categoryFilter !== ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock Levels"
        description="Monitor real-time warehouse stock, track threshold alerts, and record stock movements."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => navigate('/inventory/history')}
              leftIcon={<History className="w-4 h-4 text-slate-600" />}
            >
              Transaction History
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOpenTransactionModal(null)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Movement
            </Button>
          </div>
        }
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tracked Items"
          value={productsQuery.isLoading ? '...' : stats.totalItems}
          icon={<Boxes className="w-5 h-5 text-slate-600" />}
          subtitle="Total SKUs in store catalog"
        />
        <StatCard
          title="Healthy Stock"
          value={productsQuery.isLoading ? '...' : stats.inStock}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtitle="Stock above minimum limit"
        />
        <StatCard
          title="Low Stock Alert"
          value={productsQuery.isLoading ? '...' : stats.lowStock}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          subtitle="At or below minimum threshold"
        />
        <StatCard
          title="Out of Stock"
          value={productsQuery.isLoading ? '...' : stats.outOfStock}
          icon={<PackageX className="w-5 h-5 text-red-600" />}
          subtitle="Zero inventory available"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product, SKU, barcode..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Right Side */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium mr-1 shrink-0">Status:</span>
          {(
            [
              { key: 'ALL', label: 'All Stock' },
              { key: 'IN_STOCK', label: 'In Stock' },
              { key: 'LOW_STOCK', label: 'Low Stock' },
              { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStockFilter(tab.key)
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors select-none shrink-0 ${
                stockFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-slate-400 ml-auto hidden sm:inline">
            Showing {filteredProducts.length} of {rawProducts.length} items
          </span>
        </div>
      </div>

      {/* Query Error Display */}
      {productsQuery.isError && (
        <ErrorAlert
          title="Failed to Load Inventory"
          message="Could not load stock data from the server. Please check your connection."
          onRetry={() => productsQuery.refetch()}
        />
      )}

      {/* Inventory Stock Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {productsQuery.isLoading ? (
          <SkeletonTable cols={6} rows={6} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Warehouse className="w-8 h-8 text-slate-400" />}
            title={hasActiveFilters ? 'No Matching Products' : 'No Inventory Found'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search query, stock status, or category filter.'
                : 'No products are currently available in the system catalog.'
            }
            action={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={handleClearFilters}>
                  Reset Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead className="w-[170px]">SKU / Barcode</TableHead>
                  <TableHead className="text-center w-[130px]">Current Stock</TableHead>
                  <TableHead className="text-center w-[120px]">Min Threshold</TableHead>
                  <TableHead className="text-center w-[130px]">Status</TableHead>
                  <TableHead className="text-right w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const currentStock = product.stockQuantity ?? 0
                  const minStock = product.minimumStock ?? 0
                  const isOutOfStock = currentStock <= 0
                  const isLowStock = currentStock > 0 && currentStock <= minStock

                  return (
                    <TableRow key={product.id}>
                      {/* Product Name & Brand/Category */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 leading-tight">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            {product.category && <span>{product.category.name}</span>}
                            {product.category && product.brand && <span>•</span>}
                            {product.brand && <span>{product.brand.name}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU & Barcode */}
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-mono font-medium text-slate-800">
                            {product.sku}
                          </span>
                          {product.barcode ? (
                            <span className="font-mono text-[10px] text-slate-400">
                              {product.barcode}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No barcode</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Authoritative Current Stock */}
                      <TableCell className="text-center">
                        <span
                          className={`text-base font-bold ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </TableCell>

                      {/* Minimum Stock Threshold */}
                      <TableCell className="text-center">
                        <span className="text-xs text-slate-600 font-medium">{minStock}</span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </TableCell>

                      {/* Stock Level Badge */}
                      <TableCell className="text-center">
                        {isOutOfStock ? (
                          <Badge variant="danger" size="sm" dot>
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" size="sm" dot>
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            In Stock
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenTransactionModal(product)}
                            disabled={product.status !== 'ACTIVE'}
                            title={
                              product.status !== 'ACTIVE'
                                ? 'Cannot perform transactions on inactive products'
                                : 'Record Stock In, Stock Out, or Adjustment'
                            }
                            leftIcon={<ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />}
                          >
                            Move / Adjust
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/inventory/history?productId=${product.id}`)}
                            title="View transaction history for this product"
                            aria-label={`View history for ${product.name}`}
                          >
                            <History className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!productsQuery.isLoading && filteredProducts.length > 0 && (
          <div className="p-3 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredProducts.length}
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
        initialProduct={selectedProductForTx}
      />
    </div>
  )
}
