import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useSuppliers } from '../suppliers/useSuppliers'
import { useProducts } from '../products/useProducts'
import {
  usePurchase,
  useCreatePurchase,
  useUpdatePurchase,
} from './usePurchases'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/formatters'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import type {
  PaymentMethod,
  PurchaseRequest,
  PurchaseItemRequest,
  PurchasePaymentRequest,
  DiscountMode,
} from '../../types'
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  CreditCard,
} from 'lucide-react'

interface FormItemRow {
  tempId: string
  productId: string
  quantity: string
  purchasePrice: string
}

export interface PurchaseFormPageProps {
  mode?: 'create' | 'edit'
}

export const PurchaseFormPage: React.FC<PurchaseFormPageProps> = ({ mode = 'create' }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const editId = id ? Number(id) : null

  // Queries for dropdown dependencies
  const { suppliersQuery } = useSuppliers({ status: 'ACTIVE' })
  const activeSuppliers = (suppliersQuery.data || []).filter((s) => s.status === 'ACTIVE')

  const { productsQuery } = useProducts({ status: 'ACTIVE' })
  const activeProducts = (productsQuery.data || []).filter((p) => p.status === 'ACTIVE')

  // Query existing purchase in edit mode
  const { data: existingPurchase, isLoading: isPurchaseLoading, isError: isPurchaseError,
    error: purchaseError, refetch: refetchPurchase } = usePurchase(
    mode === 'edit' ? editId : null
  )

  // Mutations
  const createPurchaseMutation = useCreatePurchase()
  const updatePurchaseMutation = useUpdatePurchase()
  const isPending = createPurchaseMutation.isPending || updatePurchaseMutation.isPending

  // 1. Vendor & Invoice state
  const today = new Date().toISOString().split('T')[0]
  const [supplierId, setSupplierId] = useState<string>('')
  const [purchaseDate, setPurchaseDate] = useState<string>(today)
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [invoiceDate, setInvoiceDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // 2. Line Items state
  const [items, setItems] = useState<FormItemRow[]>([
    {
      tempId: 'row-1',
      productId: '',
      quantity: '1',
      purchasePrice: '0',
    },
  ])

  // 3. Discount & Tax state
  const [discountMode, setDiscountMode] = useState<DiscountMode>('NONE')
  const [discountValue, setDiscountValue] = useState<string>('')
  const [taxRate, setTaxRate] = useState<string>('0')

  // 4. Initial Payment state (create mode only)
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState<string>(today)
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [paymentNotes, setPaymentNotes] = useState<string>('')

  // UI state
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDataInitialized, setIsDataInitialized] = useState(false)

  // Pre-populate form state when in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingPurchase && !isDataInitialized) {
      if (existingPurchase.supplier?.id) {
        setSupplierId(String(existingPurchase.supplier.id))
      }
      setPurchaseDate(existingPurchase.purchaseDate)
      setInvoiceNumber(existingPurchase.invoiceNumber || '')
      setInvoiceDate(existingPurchase.invoiceDate || '')
      setNotes(existingPurchase.notes || '')
      setTaxRate(String(existingPurchase.taxRate || '0'))

      // Discount mode
      if (existingPurchase.discountPercentage != null && existingPurchase.discountPercentage > 0) {
        setDiscountMode('PERCENTAGE')
        setDiscountValue(String(existingPurchase.discountPercentage))
      } else if (existingPurchase.discountAmount != null && existingPurchase.discountAmount > 0) {
        setDiscountMode('FIXED')
        setDiscountValue(String(existingPurchase.discountAmount))
      } else {
        setDiscountMode('NONE')
        setDiscountValue('')
      }

      // Line items
      if (existingPurchase.items.length > 0) {
        setItems(
          existingPurchase.items.map((it, idx) => ({
            tempId: `row-${it.id || idx}`,
            productId: String(it.productId),
            quantity: String(it.quantity),
            purchasePrice: String(it.purchasePrice),
          }))
        )
      }
      setIsDataInitialized(true)
    }
  }, [mode, existingPurchase, isDataInitialized])

  // Map of currently selected product IDs to prevent duplicates across rows
  const selectedProductIds = useMemo(() => {
    return new Set(items.map((it) => it.productId).filter(Boolean))
  }, [items])

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0
      const p = parseFloat(item.purchasePrice) || 0
      return sum + Math.max(0, q * p)
    }, 0)
  }, [items])

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0
    if (val <= 0 || isNaN(val)) return 0
    if (discountMode === 'PERCENTAGE') {
      const clampedPct = Math.min(100, Math.max(0, val))
      return (subtotal * clampedPct) / 100
    }
    if (discountMode === 'FIXED') {
      return Math.min(subtotal, Math.max(0, val))
    }
    return 0
  }, [subtotal, discountMode, discountValue])

  const taxableSubtotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  const taxAmount = useMemo(() => {
    const rate = Math.max(0, parseFloat(taxRate) || 0)
    return (taxableSubtotal * rate) / 100
  }, [taxableSubtotal, taxRate])

  const grandTotal = useMemo(() => {
    return Math.round((taxableSubtotal + taxAmount) * 100) / 100
  }, [taxableSubtotal, taxAmount])

  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0)
  }, [items])

  // Row item actions
  const handleAddItem = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setItems((prev) => [
      ...prev,
      {
        tempId: newId,
        productId: '',
        quantity: '1',
        purchasePrice: '0',
      },
    ])
  }

  const handleRemoveItem = (tempId: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
  }

  const handleProductChange = (tempId: string, newProductId: string) => {
    const selectedProd = activeProducts.find((p) => String(p.id) === newProductId)
    const defaultPrice = selectedProd?.purchasePrice ? String(selectedProd.purchasePrice) : '0'

    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId === tempId) {
          return {
            ...it,
            productId: newProductId,
            purchasePrice: it.purchasePrice === '0' || !it.productId ? defaultPrice : it.purchasePrice,
          }
        }
        return it
      })
    )

    if (clientErrors[`item_${tempId}_product`]) {
      setClientErrors((prev) => {
        const copy = { ...prev }
        delete copy[`item_${tempId}_product`]
        return copy
      })
    }
  }

  const handleQuantityChange = (tempId: string, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, quantity: val } : it))
    )
    if (clientErrors[`item_${tempId}_quantity`]) {
      setClientErrors((prev) => {
        const copy = { ...prev }
        delete copy[`item_${tempId}_quantity`]
        return copy
      })
    }
  }

  const handlePriceChange = (tempId: string, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, purchasePrice: val } : it))
    )
    if (clientErrors[`item_${tempId}_price`]) {
      setClientErrors((prev) => {
        const copy = { ...prev }
        delete copy[`item_${tempId}_price`]
        return copy
      })
    }
  }

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!supplierId) {
      errors.supplierId = 'Supplier is required'
    }

    if (!purchaseDate) {
      errors.purchaseDate = 'Purchase date is required'
    }

    if (items.length === 0) {
      errors.items = 'At least one purchase item is required'
    }

    const seenProds = new Set<string>()
    items.forEach((it, idx) => {
      if (!it.productId) {
        errors[`item_${it.tempId}_product`] = `Item #${idx + 1}: Product is required`
      } else if (seenProds.has(it.productId)) {
        errors[`item_${it.tempId}_product`] = `Item #${idx + 1}: Duplicate product selected`
      } else {
        seenProds.add(it.productId)
      }

      const q = parseInt(it.quantity, 10)
      if (isNaN(q) || q < 1 || String(q) !== it.quantity.trim()) {
        errors[`item_${it.tempId}_quantity`] = `Item #${idx + 1}: Quantity must be an integer >= 1`
      }

      const p = parseFloat(it.purchasePrice)
      if (isNaN(p) || p < 0) {
        errors[`item_${it.tempId}_price`] = `Item #${idx + 1}: Unit price must be >= 0`
      }
    })

    if (discountMode === 'PERCENTAGE' && discountValue.trim() !== '') {
      const pct = parseFloat(discountValue)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        errors.discountValue = 'Discount percentage must be between 0 and 100'
      }
    } else if (discountMode === 'FIXED' && discountValue.trim() !== '') {
      const amt = parseFloat(discountValue)
      if (isNaN(amt) || amt < 0) {
        errors.discountValue = 'Discount amount must be >= 0'
      } else if (amt > subtotal) {
        errors.discountValue = `Discount cannot exceed subtotal (${formatINR(subtotal)})`
      }
    }

    if (taxRate.trim() !== '') {
      const t = parseFloat(taxRate)
      if (isNaN(t) || t < 0) {
        errors.taxRate = 'Tax rate must be >= 0'
      }
    }

    // Initial payment validation (create mode only)
    if (mode === 'create' && paymentAmount.trim() !== '') {
      const pAmt = parseFloat(paymentAmount)
      if (isNaN(pAmt) || pAmt <= 0) {
        errors.paymentAmount = 'Payment amount must be greater than 0'
      } else if (pAmt > grandTotal) {
        errors.paymentAmount = `Payment amount cannot exceed Grand Total (${formatINR(grandTotal)})`
      } else if (grandTotal === 0 && pAmt > 0) {
        errors.paymentAmount = 'Cannot record payment for a zero grand total'
      }
    }

    // Edit mode: grand total cannot be less than total already paid
    if (mode === 'edit' && existingPurchase) {
      if (grandTotal < existingPurchase.totalPaid) {
        errors.grandTotal = `Updated grand total (${formatINR(grandTotal)}) cannot be less than total already paid (${formatINR(existingPurchase.totalPaid)}). Adjust payments first.`
      }
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Click handler to open confirm dialog
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (validateForm()) {
      setIsConfirmOpen(true)
    }
  }

  // Final confirmed submission
  const handleConfirmedSubmit = async () => {
    setApiError(null)

    const parsedItems: PurchaseItemRequest[] = items.map((it) => ({
      productId: Number(it.productId),
      quantity: parseInt(it.quantity, 10),
      purchasePrice: parseFloat(it.purchasePrice) || 0,
    }))

    // Build mutually exclusive discount fields
    let sendDiscountPercentage: number | undefined = undefined
    let sendDiscountAmount: number | undefined = undefined
    if (discountMode === 'PERCENTAGE' && discountValue.trim() !== '') {
      sendDiscountPercentage = parseFloat(discountValue) || 0
    } else if (discountMode === 'FIXED' && discountValue.trim() !== '') {
      sendDiscountAmount = parseFloat(discountValue) || 0
    }

    // Build initial payment if provided (create mode only)
    let sendPayments: PurchasePaymentRequest[] | undefined = undefined
    if (mode === 'create') {
      const parsedPayAmt = parseFloat(paymentAmount)
      if (!isNaN(parsedPayAmt) && parsedPayAmt > 0) {
        sendPayments = [
          {
            amount: parsedPayAmt,
            paymentMethod,
            paymentDate: paymentDate || purchaseDate,
            paymentReference: paymentReference.trim() || undefined,
            notes: paymentNotes.trim() || undefined,
          },
        ]
      }
    }

    const payload: PurchaseRequest = {
      supplierId: Number(supplierId),
      purchaseDate,
      invoiceNumber: invoiceNumber.trim() || undefined,
      invoiceDate: invoiceDate || undefined,
      discountPercentage: sendDiscountPercentage,
      discountAmount: sendDiscountAmount,
      taxRate: parseFloat(taxRate) || 0,
      notes: notes.trim() || undefined,
      items: parsedItems,
      payments: sendPayments,
    }

    try {
      if (mode === 'edit' && editId) {
        const response = await updatePurchaseMutation.mutateAsync({
          id: editId,
          data: payload,
        })
        setIsConfirmOpen(false)
        toast.success(`Purchase ${response.purchaseNumber} updated successfully.`)
        navigate(`/purchases/${response.id}`)
      } else {
        const response = await createPurchaseMutation.mutateAsync(payload)
        setIsConfirmOpen(false)
        toast.success(`Purchase ${response.purchaseNumber} created successfully.`)
        navigate(`/purchases/${response.id}`)
      }
    } catch (err) {
      setIsConfirmOpen(false)
      const msg = getErrorMessage(err)
      setApiError(msg)
      const fieldValidationErrors = getValidationErrors(err)
      if (fieldValidationErrors) {
        setClientErrors((prev) => ({ ...prev, ...fieldValidationErrors }))
      }
    }
  }

  // Selected supplier name for summary
  const selectedSupplierName = useMemo(() => {
    const s = activeSuppliers.find((sup) => String(sup.id) === supplierId)
    return s?.name || existingPurchase?.supplier?.name || '—'
  }, [activeSuppliers, supplierId, existingPurchase])

  if (mode === 'edit' && isPurchaseLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading Purchase..."
          description="Fetching purchase data for editing"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Purchases', href: '/purchases' },
            { label: 'Edit' },
          ]}
        />
        <Card className="h-96 animate-pulse bg-slate-100" />
      </div>
    )
  }

  if (mode === 'edit' && (isPurchaseError || !existingPurchase)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Unable to load purchase" />
        <ErrorAlert
          message={isPurchaseError ? getErrorMessage(purchaseError) : 'Purchase not found or invalid purchase ID.'}
          onRetry={() => refetchPurchase()}
        />
        <Link to="/purchases"><Button variant="secondary">Back to Purchases</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title={mode === 'edit' ? `Edit Purchase: ${existingPurchase?.purchaseNumber || ''}` : 'New Purchase'}
        description={
          mode === 'edit'
            ? 'Update supplier procurement details and line items. Inventory will be adjusted atomically.'
            : 'Record supplier procurement and add received stock to inventory.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Purchases', href: '/purchases' },
          {
            label:
              mode === 'edit'
                ? `Edit ${existingPurchase?.purchaseNumber || ''}`
                : 'New Purchase',
          },
        ]}
        actions={
          <Link to={mode === 'edit' ? `/purchases/${editId}` : '/purchases'}>
            <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              {mode === 'edit' ? 'Back to Details' : 'Back to Purchases'}
            </Button>
          </Link>
        }
      />

      {/* Edit Mode Stock Impact Warning */}
      {mode === 'edit' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Inventory Impact Notice</p>
            <p className="text-amber-800 mt-1 leading-relaxed">
              Changing purchase quantities will atomically adjust warehouse inventory. Increasing quantities records <strong>STOCK_IN</strong>. Reducing quantities records <strong>STOCK_OUT</strong> and requires sufficient current on-hand stock.
            </p>
          </div>
        </div>
      )}

      {/* Top Level API Error Display */}
      {apiError && (
        <ErrorAlert
          title={mode === 'edit' ? 'Could not update purchase' : 'Could not create purchase'}
          message={apiError}
          onRetry={() => setIsConfirmOpen(true)}
        />
      )}

      {/* Grand Total Validation Error in Edit Mode */}
      {clientErrors.grandTotal && (
        <ErrorAlert
          title="Payment Constraint Conflict"
          message={clientErrors.grandTotal}
        />
      )}

      {/* Warning if no active suppliers exist */}
      {suppliersQuery.isSuccess && activeSuppliers.length === 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            No active suppliers are available. Create or activate a supplier before recording a purchase.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmitClick} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Area (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECTION 1: Vendor & Invoice Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <CardTitle>Vendor &amp; Invoice Details</CardTitle>
                </div>
                <CardDescription>Specify the supplier, invoice details, and date of procurement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supplier Select */}
                  <div>
                    <Select
                      label="Supplier *"
                      required
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      error={clientErrors.supplierId}
                      disabled={isPending}
                    >
                      <option value="">— Select Active Supplier —</option>
                      {activeSuppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.gstNumber ? `(${s.gstNumber})` : ''}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <Input
                      label="Purchase Date *"
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      error={clientErrors.purchaseDate}
                      disabled={isPending}
                    />
                  </div>

                  {/* Vendor Invoice Number */}
                  <div>
                    <Input
                      label="Vendor Invoice Number"
                      placeholder="e.g. INV-2026-0042"
                      maxLength={100}
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Vendor Invoice Date */}
                  <div>
                    <Input
                      label="Vendor Invoice Date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <Input
                      label="Notes"
                      placeholder="Optional remarks (max 1000 characters)"
                      maxLength={1000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Purchase Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <CardTitle>Purchase Items</CardTitle>
                  </div>
                  <CardDescription>
                    Add products, quantities received, and negotiated purchase prices.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItem}
                  disabled={isPending}
                >
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientErrors.items && (
                  <p className="text-xs text-red-600 font-medium">{clientErrors.items}</p>
                )}

                <div className="space-y-3">
                  {items.map((row, index) => {
                    const rowQty = parseFloat(row.quantity) || 0
                    const rowPrice = parseFloat(row.purchasePrice) || 0
                    const rowTotal = Math.max(0, rowQty * rowPrice)

                    const prodErr = clientErrors[`item_${row.tempId}_product`]
                    const qtyErr = clientErrors[`item_${row.tempId}_quantity`]
                    const priceErr = clientErrors[`item_${row.tempId}_price`]

                    return (
                      <div
                        key={row.tempId}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Item #{index + 1}</span>
                          <span className="text-slate-500 font-normal">
                            Line Total:{' '}
                            <strong className="text-slate-900 font-semibold">
                              {formatINR(rowTotal)}
                            </strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          {/* Product Dropdown (6 cols) */}
                          <div className="sm:col-span-6">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Product *
                            </label>
                            <select
                              value={row.productId}
                              onChange={(e) => handleProductChange(row.tempId, e.target.value)}
                              disabled={isPending}
                              className={`w-full text-xs rounded-md border ${
                                prodErr ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                              } bg-white px-2.5 py-2 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            >
                              <option value="">— Select Product —</option>
                              {activeProducts.map((p) => {
                                const isSelectedElsewhere =
                                  selectedProductIds.has(String(p.id)) &&
                                  row.productId !== String(p.id)
                                return (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    disabled={isSelectedElsewhere}
                                  >
                                    {p.name} — {p.sku} {isSelectedElsewhere ? '(Already added)' : ''}
                                  </option>
                                )
                              })}
                            </select>
                            {prodErr && (
                              <p className="text-[11px] text-red-600 mt-1">{prodErr}</p>
                            )}
                          </div>

                          {/* Quantity (2 cols) */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Qty *
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(row.tempId, e.target.value)}
                              disabled={isPending}
                              className={`w-full text-xs rounded-md border ${
                                qtyErr ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                              } bg-white px-2.5 py-2 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                            {qtyErr && (
                              <p className="text-[11px] text-red-600 mt-1">{qtyErr}</p>
                            )}
                          </div>

                          {/* Unit Purchase Price (3 cols) */}
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Unit Price (₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.purchasePrice}
                              onChange={(e) => handlePriceChange(row.tempId, e.target.value)}
                              disabled={isPending}
                              className={`w-full text-xs rounded-md border ${
                                priceErr ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                              } bg-white px-2.5 py-2 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                            {priceErr && (
                              <p className="text-[11px] text-red-600 mt-1">{priceErr}</p>
                            )}
                          </div>

                          {/* Remove button (1 col) */}
                          <div className="sm:col-span-1 flex justify-center pb-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-8 w-8 text-slate-400 hover:text-red-600 disabled:opacity-30"
                              onClick={() => handleRemoveItem(row.tempId)}
                              disabled={items.length <= 1 || isPending}
                              title={items.length <= 1 ? 'At least one item required' : 'Remove item'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: Discount & Tax */}
            <Card>
              <CardHeader>
                <CardTitle>Discounts &amp; Taxes</CardTitle>
                <CardDescription>
                  Apply an order-level discount and tax percentage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discount Mode Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Discount Type
                    </label>
                    <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountMode('NONE')
                          setDiscountValue('')
                        }}
                        className={`flex-1 py-1 rounded font-medium transition-colors ${
                          discountMode === 'NONE'
                            ? 'bg-white shadow-xs text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode('PERCENTAGE')}
                        className={`flex-1 py-1 rounded font-medium transition-colors ${
                          discountMode === 'PERCENTAGE'
                            ? 'bg-white shadow-xs text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode('FIXED')}
                        className={`flex-1 py-1 rounded font-medium transition-colors ${
                          discountMode === 'FIXED'
                            ? 'bg-white shadow-xs text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Fixed Amount (₹)
                      </button>
                    </div>
                  </div>

                  {/* Discount Value Input */}
                  {discountMode !== 'NONE' && (
                    <div>
                      <Input
                        label={
                          discountMode === 'PERCENTAGE'
                            ? 'Discount Percentage (0–100%)'
                            : 'Discount Amount (₹)'
                        }
                        type="number"
                        min="0"
                        max={discountMode === 'PERCENTAGE' ? '100' : subtotal}
                        step={discountMode === 'PERCENTAGE' ? '0.1' : '0.01'}
                        placeholder={discountMode === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        error={clientErrors.discountValue}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {/* Tax Rate Input */}
                  <div>
                    <Input
                      label="Tax Rate (%)"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 18 or 0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      error={clientErrors.taxRate}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 4: Initial Payment (Create mode only) */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <CardTitle>Initial Payment (Optional)</CardTitle>
                  </div>
                  <CardDescription>
                    Record an immediate payment now, or add installment payments later.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment Amount */}
                    <div>
                      <Input
                        label="Payment Amount (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Leave blank for unpaid"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        error={clientErrors.paymentAmount}
                        helperText={
                          paymentAmount
                            ? `Remaining liability: ${formatINR(Math.max(0, grandTotal - (parseFloat(paymentAmount) || 0)))}`
                            : 'No payment recorded on creation if left blank'
                        }
                        disabled={isPending || grandTotal <= 0}
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <Select
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        disabled={!paymentAmount || isPending}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CARD">Card</option>
                        <option value="OTHER">Other</option>
                      </Select>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <Input
                        label="Payment Date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={!paymentAmount || isPending}
                      />
                    </div>

                    {/* Payment Reference */}
                    <div>
                      <Input
                        label="Payment Reference"
                        placeholder="e.g. UTR / Transaction ID"
                        maxLength={100}
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        disabled={!paymentAmount || isPending}
                      />
                    </div>

                    {/* Payment Notes */}
                    <div className="sm:col-span-2">
                      <Input
                        label="Payment Notes"
                        placeholder="e.g. Transaction or cheque details (max 500 characters)"
                        maxLength={500}
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        disabled={!paymentAmount || isPending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Order Summary Box (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-300 shadow-sm sticky top-6">
              <CardHeader className="bg-slate-50/80 border-b border-slate-200">
                <CardTitle className="text-base">Order Summary</CardTitle>
                <CardDescription>Live cost breakdown before submission</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Subtotal ({totalUnits} units)</span>
                  <span className="font-semibold text-slate-900 text-sm">{formatINR(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>
                      Discount {discountMode === 'PERCENTAGE' ? `(${discountValue}%)` : ''}
                    </span>
                    <span className="font-semibold text-sm">-{formatINR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Taxable Subtotal</span>
                  <span className="font-medium text-slate-900">{formatINR(taxableSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tax ({parseFloat(taxRate) || 0}%)</span>
                  <span className="font-medium text-slate-900">+{formatINR(taxAmount)}</span>
                </div>

                <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Grand Total</span>
                  <span className="text-xl font-bold text-blue-700">{formatINR(grandTotal)}</span>
                </div>

                {/* In edit mode, show existing paid amount if any */}
                {mode === 'edit' && existingPurchase && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Paid Amount</span>
                      <span className="font-medium text-emerald-700">
                        {formatINR(existingPurchase.totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 font-medium">
                      <span>Adjusted Balance</span>
                      <span className="text-amber-700 font-semibold">
                        {formatINR(Math.max(0, grandTotal - existingPurchase.totalPaid))}
                      </span>
                    </div>
                  </div>
                )}

                {/* In create mode, show initial payment breakdown preview */}
                {mode === 'create' && paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Initial Payment ({paymentMethod})</span>
                      <span className="font-medium text-emerald-700">
                        {formatINR(parseFloat(paymentAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 font-medium">
                      <span>Outstanding Balance</span>
                      <span className="text-amber-700 font-semibold">
                        {formatINR(Math.max(0, grandTotal - parseFloat(paymentAmount)))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 text-sm font-semibold justify-center shadow-xs"
                    isLoading={isPending}
                  >
                    {mode === 'edit' ? 'Update Purchase Order' : 'Create Purchase Order'}
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    {mode === 'edit'
                      ? 'Inventory deltas will be calculated and updated atomically.'
                      : 'Stock will be received into warehouse inventory immediately upon confirmation.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog Before Submitting */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={mode === 'edit' ? `Update Purchase ${existingPurchase?.purchaseNumber || ''}?` : 'Create Purchase?'}
        message={
          mode === 'edit'
            ? `This update will atomically adjust warehouse inventory for any changed product quantities.\n\n` +
              `• Supplier: ${selectedSupplierName}\n` +
              `• Items: ${items.length} (${totalUnits} total unit${totalUnits === 1 ? '' : 's'})\n` +
              `• Updated Grand Total: ${formatINR(grandTotal)}`
            : `This purchase will immediately record stock intake and increase inventory quantities.\n\n` +
              `• Supplier: ${selectedSupplierName}\n` +
              `• Items: ${items.length} (${totalUnits} total unit${totalUnits === 1 ? '' : 's'})\n` +
              `• Grand Total: ${formatINR(grandTotal)}` +
              (paymentAmount && parseFloat(paymentAmount) > 0
                ? `\n• Initial Payment: ${formatINR(parseFloat(paymentAmount))} (${paymentMethod})`
                : '')
        }
        confirmLabel={mode === 'edit' ? 'Save Changes' : 'Create Purchase'}
        cancelLabel="Back to Edit"
        isDestructive={false}
        isLoading={isPending}
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
