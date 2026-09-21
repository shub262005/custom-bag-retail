import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useCreateInventoryTransaction } from './useInventory'
import { useProducts } from '../products/useProducts'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../api/errorParser'
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Tag,
  Hash,
} from 'lucide-react'
import type { ProductResponse, TransactionType, InventoryTransactionRequest } from '../../types'

export interface InventoryTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  initialProduct?: ProductResponse | null
  onSuccess?: () => void
}

export const InventoryTransactionModal: React.FC<InventoryTransactionModalProps> = ({
  isOpen,
  onClose,
  initialProduct = null,
  onSuccess,
}) => {
  const toast = useToast()
  const createMutation = useCreateInventoryTransaction()

  // Fetch products for product selection
  const { productsQuery } = useProducts()
  const allProducts = productsQuery.data || []

  // Filter to only active products (backend forbids inactive products)
  const activeProducts = useMemo(() => {
    return allProducts.filter((p) => p.status === 'ACTIVE')
  }, [allProducts])

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [transactionType, setTransactionType] = useState<TransactionType>('STOCK_IN')
  const [quantityInput, setQuantityInput] = useState<string>('')
  const [movementDate, setMovementDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [referenceType, setReferenceType] = useState<string>('')
  const [referenceId, setReferenceId] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  // Validation & confirmation states
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  // Sync initial product if provided
  useEffect(() => {
    if (isOpen) {
      setApiError(null)
      setErrors({})
      setShowConfirmation(false)

      if (initialProduct && initialProduct.status === 'ACTIVE') {
        setSelectedProductId(String(initialProduct.id))
      } else if (!selectedProductId && activeProducts.length > 0) {
        setSelectedProductId(String(activeProducts[0].id))
      }

      setQuantityInput('')
      setReason('')
      setReferenceType('')
      setReferenceId('')
      setMovementDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen, initialProduct, activeProducts])

  const selectedProduct = useMemo(() => {
    return activeProducts.find((p) => String(p.id) === selectedProductId) || null
  }, [activeProducts, selectedProductId])

  const currentStock = selectedProduct ? selectedProduct.stockQuantity : 0
  const parsedQuantity = parseInt(quantityInput, 10)
  const isValidQty = !isNaN(parsedQuantity)

  // Compute calculated preview
  const previewData = useMemo(() => {
    if (!selectedProduct || !isValidQty) return null

    if (transactionType === 'STOCK_IN') {
      const targetStock = currentStock + parsedQuantity
      return {
        actionLabel: 'Add Stock',
        targetStock,
        deltaText: `+${parsedQuantity}`,
        hasWarning: parsedQuantity <= 0,
        warningText: parsedQuantity <= 0 ? 'Quantity must be at least 1' : null,
      }
    } else if (transactionType === 'STOCK_OUT') {
      const targetStock = currentStock - parsedQuantity
      const isExcess = parsedQuantity > currentStock
      return {
        actionLabel: 'Remove Stock',
        targetStock: targetStock < 0 ? 0 : targetStock,
        deltaText: `-${parsedQuantity}`,
        hasWarning: parsedQuantity <= 0 || isExcess,
        warningText:
          parsedQuantity <= 0
            ? 'Quantity must be at least 1'
            : isExcess
            ? `Requested quantity (${parsedQuantity}) exceeds current stock (${currentStock})`
            : null,
      }
    } else {
      // ADJUSTMENT
      const targetStock = parsedQuantity
      const diff = targetStock - currentStock
      const deltaText = diff > 0 ? `+${diff}` : `${diff}`
      return {
        actionLabel: 'Set Physical Count',
        targetStock,
        deltaText: `Adjustment (Net: ${deltaText})`,
        hasWarning: parsedQuantity < 0,
        warningText: parsedQuantity < 0 ? 'Target stock count cannot be negative' : null,
      }
    }
  }, [selectedProduct, isValidQty, parsedQuantity, transactionType, currentStock])

  // Form Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}

    if (!selectedProductId) {
      errs.productId = 'Please select a product'
    }

    if (!quantityInput.trim()) {
      errs.quantity = 'Quantity is required'
    } else if (!isValidQty) {
      errs.quantity = 'Please enter a valid whole number'
    } else if (transactionType === 'STOCK_IN' && parsedQuantity <= 0) {
      errs.quantity = 'Quantity to add must be greater than 0'
    } else if (transactionType === 'STOCK_OUT' && parsedQuantity <= 0) {
      errs.quantity = 'Quantity to remove must be greater than 0'
    } else if (transactionType === 'STOCK_OUT' && parsedQuantity > currentStock) {
      errs.quantity = `Insufficient stock: Current stock is ${currentStock}, cannot remove ${parsedQuantity}`
    } else if (transactionType === 'ADJUSTMENT' && parsedQuantity < 0) {
      errs.quantity = 'Target physical stock count cannot be negative'
    }

    if (reason.length > 255) {
      errs.reason = 'Reason cannot exceed 255 characters'
    }
    if (referenceType.length > 50) {
      errs.referenceType = 'Reference type cannot exceed 50 characters'
    }
    if (referenceId.length > 100) {
      errs.referenceId = 'Reference ID cannot exceed 100 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleReviewClick = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (validateForm()) {
      setShowConfirmation(true)
    }
  }

  const handleFinalSubmit = async () => {
    if (!selectedProduct) return

    setApiError(null)

    const payload: InventoryTransactionRequest = {
      productId: selectedProduct.id,
      transactionType,
      quantity: parsedQuantity,
      reason: reason.trim() || undefined,
      referenceType: referenceType.trim() || undefined,
      referenceId: referenceId.trim() || undefined,
      movementDate: movementDate || undefined,
    }

    try {
      const response = await createMutation.mutateAsync(payload)
      toast.success(
        `Transaction recorded for "${selectedProduct.name}". Stock updated: ${response.quantityBefore} → ${response.quantityAfter}`
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setApiError(errorMsg)
      setShowConfirmation(false) // return to form to let user adjust
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!createMutation.isPending) {
          onClose()
        }
      }}
      title={
        showConfirmation
          ? 'Confirm Stock Movement'
          : 'Record Inventory Movement / Adjustment'
      }
      size="md"
      footer={
        showConfirmation ? (
          <>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={createMutation.isPending}
            >
              Back to Edit
            </Button>
            <Button
              variant={transactionType === 'STOCK_OUT' ? 'danger' : 'primary'}
              onClick={handleFinalSubmit}
              isLoading={createMutation.isPending}
            >
              Confirm &amp; Apply Stock
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReviewClick}
              disabled={!selectedProduct || createMutation.isPending}
            >
              Review Movement
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {apiError && (
          <ErrorAlert
            title="Transaction Failed"
            message={apiError}
          />
        )}

        {showConfirmation ? (
          /* ================= Safety Confirmation Screen ================= */
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Authoritative Stock Impact Notice</p>
                <p>
                  This action will immediately create an immutable inventory transaction and modify
                  the live stock count in the database.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Selected Product:</span>
                <span className="text-slate-900 font-semibold text-right">
                  {selectedProduct?.name} ({selectedProduct?.sku})
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Movement Type:</span>
                <Badge
                  variant={
                    transactionType === 'STOCK_IN'
                      ? 'success'
                      : transactionType === 'STOCK_OUT'
                      ? 'danger'
                      : 'info'
                  }
                  size="md"
                >
                  {transactionType === 'STOCK_IN'
                    ? 'STOCK IN (+)'
                    : transactionType === 'STOCK_OUT'
                    ? 'STOCK OUT (-)'
                    : 'PHYSICAL ADJUSTMENT'}
                </Badge>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Current Authoritative Stock:</span>
                <span className="font-semibold text-slate-700">{currentStock} units</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {transactionType === 'STOCK_IN'
                    ? 'Quantity to Add:'
                    : transactionType === 'STOCK_OUT'
                    ? 'Quantity to Remove:'
                    : 'Target Physical Count:'}
                </span>
                <span className="font-bold text-slate-900 text-base">{parsedQuantity} units</span>
              </div>

              <div className="flex justify-between items-center pt-1 bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-700 font-bold">Resulting Stock Level:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 line-through text-xs">{currentStock}</span>
                  <span className="text-xs font-bold text-slate-400">→</span>
                  <span className="text-base font-extrabold text-blue-600">
                    {previewData?.targetStock} units
                  </span>
                </div>
              </div>

              {movementDate && (
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Movement Date:</span>
                  <span className="font-medium text-slate-700">{movementDate}</span>
                </div>
              )}

              {(referenceType || referenceId) && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Reference:</span>
                  <span className="font-medium text-slate-700">
                    {referenceType} {referenceId && `#${referenceId}`}
                  </span>
                </div>
              )}

              {reason && (
                <div className="text-xs text-slate-500 pt-1">
                  <span className="font-medium text-slate-600">Reason: </span>
                  <span className="italic text-slate-700">"{reason}"</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= Input Form Screen ================= */
          <form onSubmit={handleReviewClick} className="space-y-4">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Product <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  setErrors((prev) => ({ ...prev, productId: '' }))
                }}
                disabled={activeProducts.length === 0}
              >
                {activeProducts.length === 0 ? (
                  <option value="">No active products available</option>
                ) : (
                  activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.sku}] — Current Stock: {p.stockQuantity}
                    </option>
                  ))
                )}
              </Select>
              {errors.productId && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.productId}</p>
              )}

              {selectedProduct && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">SKU: </span>
                    <span className="font-semibold text-slate-800">{selectedProduct.sku}</span>
                    {selectedProduct.barcode && (
                      <span className="ml-2 text-slate-500">
                        Barcode: <span className="font-semibold text-slate-800">{selectedProduct.barcode}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Current Stock:</span>
                    <Badge
                      variant={
                        selectedProduct.stockQuantity <= 0
                          ? 'danger'
                          : selectedProduct.stockQuantity <= selectedProduct.minimumStock
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {selectedProduct.stockQuantity} units
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Type Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Movement Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('STOCK_IN')
                    setErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  className={`p-2.5 border rounded-lg text-left transition-all select-none flex flex-col items-center sm:items-start text-center sm:text-left ${
                    transactionType === 'STOCK_IN'
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>STOCK IN</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 hidden sm:inline">
                    Receive restock
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('STOCK_OUT')
                    setErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  className={`p-2.5 border rounded-lg text-left transition-all select-none flex flex-col items-center sm:items-start text-center sm:text-left ${
                    transactionType === 'STOCK_OUT'
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>STOCK OUT</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 hidden sm:inline">
                    Damage / Return
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('ADJUSTMENT')
                    setErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  className={`p-2.5 border rounded-lg text-left transition-all select-none flex flex-col items-center sm:items-start text-center sm:text-left ${
                    transactionType === 'ADJUSTMENT'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ADJUSTMENT</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 hidden sm:inline">
                    Physical Count
                  </span>
                </button>
              </div>
            </div>

            {/* Quantity Input based on Transaction Type */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {transactionType === 'STOCK_IN' && 'Quantity to Add'}
                  {transactionType === 'STOCK_OUT' && 'Quantity to Remove'}
                  {transactionType === 'ADJUSTMENT' && 'Target Physical Stock Count'}
                  <span className="text-red-500"> *</span>
                </label>
                {transactionType === 'ADJUSTMENT' && (
                  <span className="text-[11px] font-medium text-blue-600">
                    Desired Final Shelf Count
                  </span>
                )}
              </div>

              <Input
                type="number"
                min={transactionType === 'ADJUSTMENT' ? '0' : '1'}
                placeholder={
                  transactionType === 'STOCK_IN'
                    ? 'Enter units to add (min 1)'
                    : transactionType === 'STOCK_OUT'
                    ? `Enter units to remove (max ${currentStock})`
                    : `Enter counted physical stock (current: ${currentStock})`
                }
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value)
                  setErrors((prev) => ({ ...prev, quantity: '' }))
                }}
                error={errors.quantity}
              />

              {/* Helper explanation text */}
              <p className="mt-1 text-[11px] text-slate-500">
                {transactionType === 'STOCK_IN' &&
                  'Positive whole number to add to the existing warehouse inventory.'}
                {transactionType === 'STOCK_OUT' &&
                  'Units to deduct from current stock. Must not exceed current available stock.'}
                {transactionType === 'ADJUSTMENT' &&
                  'Enter the total physical count verified on shelves. The backend sets stock to this exact number and computes the adjustment delta.'}
              </p>

              {/* Live Preview Box */}
              {previewData && (
                <div
                  className={`mt-2 p-2.5 rounded border text-xs flex items-center justify-between ${
                    previewData.hasWarning
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {previewData.hasWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span>
                      {previewData.warningText ||
                        `Expected result: ${currentStock} → ${previewData.targetStock} units (${previewData.deltaText})`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Movement Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Movement Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  className="pl-8"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Reference Type & ID (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Type <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. AUDIT, PO, DAMAGE"
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}
                    maxLength={50}
                    error={errors.referenceType}
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. AUDIT-01, PO-102"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    maxLength={100}
                    error={errors.referenceId}
                  />
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Note <span className="text-slate-400 font-normal">(Max 255 chars)</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="e.g. Quarterly physical cycle count reconciliation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={255}
                  error={errors.reason}
                />
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
