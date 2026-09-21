import type { ProductStatus, CategoryStatus, BrandStatus } from './common.types'

// Category types
export interface CategoryResponse {
  id: number
  name: string
  status: CategoryStatus
  createdAt: string
  updatedAt: string
}

export interface CategoryRequest {
  name: string
  status?: CategoryStatus
}

export interface CategoryStatusUpdateRequest {
  status: CategoryStatus
}

// Brand types
export interface BrandResponse {
  id: number
  name: string
  status: BrandStatus
  createdAt: string
  updatedAt: string
}

export interface BrandRequest {
  name: string
  status?: BrandStatus
}

export interface BrandStatusUpdateRequest {
  status: BrandStatus
}

// Product types
export interface ProductResponse {
  id: number
  name: string
  sku: string
  barcode?: string | null
  category?: CategoryResponse | null
  brand?: BrandResponse | null
  color?: string | null
  capacity?: string | null
  purchasePrice: number
  lastPurchasePrice?: number | null
  sellingPrice: number
  stockQuantity: number
  minimumStock: number
  imageUrl?: string | null
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface ProductRequest {
  name: string
  sku: string
  barcode?: string
  categoryId: number
  brandId?: number
  color?: string
  capacity?: string
  purchasePrice: number
  sellingPrice: number
  minimumStock: number
  imageUrl?: string
  status?: ProductStatus
}

export interface ProductStatusUpdateRequest {
  status: ProductStatus
}
