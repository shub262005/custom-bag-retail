import React, { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { useProducts } from './useProducts'
import { useCategories } from '../categories/useCategories'
import { useBrands } from '../brands/useBrands'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import { Info, AlertTriangle } from 'lucide-react'
import type { ProductResponse, ProductRequest, ProductStatus } from '../../types'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  productToEdit?: ProductResponse | null
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const isEditing = !!productToEdit
  const toast = useToast()

  const { createProductMutation, updateProductMutation } = useProducts()

  // Load active categories and brands for selectors
  const { categoriesQuery } = useCategories('ACTIVE')
  const { brandsQuery } = useBrands('ACTIVE')

  // Form states
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [color, setColor] = useState('')
  const [capacity, setCapacity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState<string>('')
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [minimumStock, setMinimumStock] = useState<string>('5')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ACTIVE')

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverValidationErrors, setServerValidationErrors] = useState<Record<string, string> | undefined>(undefined)

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '')
      setSku(productToEdit.sku || '')
      setBarcode(productToEdit.barcode || '')
      setCategoryId(productToEdit.category ? String(productToEdit.category.id) : '')
      setBrandId(productToEdit.brand ? String(productToEdit.brand.id) : '')
      setColor(productToEdit.color || '')
      setCapacity(productToEdit.capacity || '')
      setPurchasePrice(productToEdit.purchasePrice !== undefined ? String(productToEdit.purchasePrice) : '')
      setSellingPrice(productToEdit.sellingPrice !== undefined ? String(productToEdit.sellingPrice) : '')
      setMinimumStock(productToEdit.minimumStock !== undefined ? String(productToEdit.minimumStock) : '5')
      setImageUrl(productToEdit.imageUrl || '')
      setStatus(productToEdit.status || 'ACTIVE')
    } else {
      setName('')
      setSku('')
      setBarcode('')
      setCategoryId('')
      setBrandId('')
      setColor('')
      setCapacity('')
      setPurchasePrice('')
      setSellingPrice('')
      setMinimumStock('5')
      setImageUrl('')
      setStatus('ACTIVE')
    }
    setFieldErrors({})
    setServerError(null)
    setServerValidationErrors(undefined)
  }, [productToEdit, isOpen])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    setServerError(null)
    setServerValidationErrors(undefined)

    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Product name is required'
    } else if (trimmedName.length < 2 || trimmedName.length > 150) {
      errors.name = 'Product name must be between 2 and 150 characters'
    }

    const trimmedSku = sku.trim()
    if (!trimmedSku) {
      errors.sku = 'SKU is required'
    } else if (trimmedSku.length < 2 || trimmedSku.length > 50) {
      errors.sku = 'SKU must be between 2 and 50 characters'
    }

    if (barcode.trim().length > 50) {
      errors.barcode = 'Barcode must be at most 50 characters'
    }

    if (!categoryId) {
      errors.categoryId = 'Category is required'
    }

    if (color.trim().length > 50) {
      errors.color = 'Color must be at most 50 characters'
    }

    if (capacity.trim().length > 50) {
      errors.capacity = 'Capacity must be at most 50 characters'
    }

    const pPrice = parseFloat(purchasePrice)
    if (isNaN(pPrice) || pPrice < 0.01) {
      errors.purchasePrice = 'Purchase price must be greater than 0'
    }

    const sPrice = parseFloat(sellingPrice)
    if (isNaN(sPrice) || sPrice < 0.01) {
      errors.sellingPrice = 'Selling price must be greater than 0'
    }

    const minStock = parseInt(minimumStock, 10)
    if (isNaN(minStock) || minStock < 0) {
      errors.minimumStock = 'Minimum stock must be greater than or equal to 0'
    }

    if (imageUrl.trim().length > 255) {
      errors.imageUrl = 'Image URL must be at most 255 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return

    const payload: ProductRequest = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() ? barcode.trim() : undefined,
      categoryId: Number(categoryId),
      brandId: brandId ? Number(brandId) : undefined,
      color: color.trim() ? color.trim() : undefined,
      capacity: capacity.trim() ? capacity.trim() : undefined,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      minimumStock: parseInt(minimumStock, 10),
      imageUrl: imageUrl.trim() ? imageUrl.trim() : undefined,
      status,
    }

    try {
      if (isEditing && productToEdit) {
        await updateProductMutation.mutateAsync({
          id: productToEdit.id,
          data: payload,
        })
        toast.success(`Product "${payload.name}" updated successfully.`)
      } else {
        await createProductMutation.mutateAsync(payload)
        toast.success(`Product "${payload.name}" created successfully.`)
      }
      onClose()
    } catch (err) {
      const msg = getErrorMessage(err)
      const valErrors = getValidationErrors(err)
      setServerError(msg)
      setServerValidationErrors(valErrors)
      if (valErrors) {
        setFieldErrors((prev) => ({ ...prev, ...valErrors }))
      }
    }
  }

  // Active categories list
  const activeCategories = categoriesQuery.data || []
  // If editing and the product currently has a category not in activeCategories, include it preserved
  const categoryOptions = [...activeCategories]
  if (
    isEditing &&
    productToEdit?.category &&
    !categoryOptions.some((c) => c.id === productToEdit.category?.id)
  ) {
    categoryOptions.push({
      ...productToEdit.category,
      name: `${productToEdit.category.name} (Current)`,
    })
  }

  // Active brands list
  const activeBrands = brandsQuery.data || []
  const brandOptions = [...activeBrands]
  if (
    isEditing &&
    productToEdit?.brand &&
    !brandOptions.some((b) => b.id === productToEdit.brand?.id)
  ) {
    brandOptions.push({
      ...productToEdit.brand,
      name: `${productToEdit.brand.name} (Current)`,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      description={
        isEditing
          ? 'Update product details, pricing, and minimum stock threshold. Stock levels remain unchanged.'
          : 'Register a new bag product in the store catalog.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Critical Stock Rule Callout */}
        <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {isEditing ? (
              <span>
                <strong>Stock Immutability:</strong> Current warehouse stock is{' '}
                <strong>{productToEdit?.stockQuantity ?? 0} units</strong>. Editing product details does not modify stock. Stock is adjusted exclusively via Purchases and Inventory transactions.
              </span>
            ) : (
              <span>
                <strong>Initial Stock Rule:</strong> New products start with <strong>0 stock</strong>. Stock is added through Purchases and Inventory transactions.
              </span>
            )}
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <ErrorAlert
            title="Unable to save product"
            message={serverError}
            validationErrors={serverValidationErrors}
          />
        )}

        {/* Categories availability warning */}
        {!isEditing && !categoriesQuery.isLoading && activeCategories.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              No active categories available. You must create or activate a category before adding a product.
            </span>
          </div>
        )}

        {/* Row 1: Name & SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Travel Backpack 40L"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
            }}
            error={fieldErrors.name}
            disabled={isSubmitting}
            autoFocus
          />

          <Input
            label="SKU"
            required
            placeholder="e.g. BP-TRV-040"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value)
              if (fieldErrors.sku) setFieldErrors((prev) => ({ ...prev, sku: '' }))
            }}
            error={fieldErrors.sku}
            disabled={isSubmitting}
          />
        </div>

        {/* Row 2: Barcode & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Barcode (Optional)"
            placeholder="e.g. 8901234567890"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value)
              if (fieldErrors.barcode) setFieldErrors((prev) => ({ ...prev, barcode: '' }))
            }}
            error={fieldErrors.barcode}
            disabled={isSubmitting}
          />

          <Select
            label="Category"
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              if (fieldErrors.categoryId) setFieldErrors((prev) => ({ ...prev, categoryId: '' }))
            }}
            placeholder={categoriesQuery.isLoading ? 'Loading categories...' : 'Select Category'}
            options={categoryOptions.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            error={fieldErrors.categoryId}
            disabled={isSubmitting || categoriesQuery.isLoading}
          />
        </div>

        {/* Row 3: Brand & Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Brand (Optional)"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            placeholder={brandsQuery.isLoading ? 'Loading brands...' : 'None / Unbranded'}
            options={brandOptions.map((b) => ({
              value: b.id,
              label: b.name,
            }))}
            disabled={isSubmitting || brandsQuery.isLoading}
          />

          <Input
            label="Color (Optional)"
            placeholder="e.g. Navy Blue, Matte Black"
            value={color}
            onChange={(e) => {
              setColor(e.target.value)
              if (fieldErrors.color) setFieldErrors((prev) => ({ ...prev, color: '' }))
            }}
            error={fieldErrors.color}
            disabled={isSubmitting}
          />
        </div>

        {/* Row 4: Capacity & Minimum Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Capacity / Size (Optional)"
            placeholder="e.g. 35L, 20-inch, Standard"
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value)
              if (fieldErrors.capacity) setFieldErrors((prev) => ({ ...prev, capacity: '' }))
            }}
            error={fieldErrors.capacity}
            disabled={isSubmitting}
          />

          <Input
            label="Minimum Stock Threshold"
            required
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 5"
            value={minimumStock}
            onChange={(e) => {
              setMinimumStock(e.target.value)
              if (fieldErrors.minimumStock) setFieldErrors((prev) => ({ ...prev, minimumStock: '' }))
            }}
            error={fieldErrors.minimumStock}
            helperText="Triggers low-stock warning when current stock falls at or below this value."
            disabled={isSubmitting}
          />
        </div>

        {/* Row 5: Purchase Price & Selling Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Purchase Price (₹)"
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={purchasePrice}
            onChange={(e) => {
              setPurchasePrice(e.target.value)
              if (fieldErrors.purchasePrice) setFieldErrors((prev) => ({ ...prev, purchasePrice: '' }))
            }}
            error={fieldErrors.purchasePrice}
            disabled={isSubmitting}
          />

          <Input
            label="Selling Price (₹)"
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={sellingPrice}
            onChange={(e) => {
              setSellingPrice(e.target.value)
              if (fieldErrors.sellingPrice) setFieldErrors((prev) => ({ ...prev, sellingPrice: '' }))
            }}
            error={fieldErrors.sellingPrice}
            disabled={isSubmitting}
          />
        </div>

        {/* Row 6: Image URL & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Image URL (Optional)"
            type="url"
            placeholder="https://example.com/images/bag.jpg"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              if (fieldErrors.imageUrl) setFieldErrors((prev) => ({ ...prev, imageUrl: '' }))
            }}
            error={fieldErrors.imageUrl}
            helperText="Direct image link (max 255 characters)."
            disabled={isSubmitting}
          />

          <Select
            label="Product Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active (Available for sales & purchases)' },
              { value: 'INACTIVE', label: 'Inactive (Hidden from active operations)' },
            ]}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  )
}
