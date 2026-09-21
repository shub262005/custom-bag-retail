import type { CancellationReason, PaymentMethod, SaleAuditAction, SaleStatus } from './common.types'

export interface SaleItemResponse {
  id: number
  productId?: number | null
  productName?: string | null
  sku?: string | null
  barcode?: string | null
  quantity: number
  sellingPrice: number
  itemTotal: number
}

export interface SaleItemRequest {
  productId: number
  quantity: number
  sellingPrice: number
}

export interface SalePaymentResponse {
  id: number
  amount: number
  paymentMethod: PaymentMethod
  description?: string | null
  createdAt: string
}

export interface SaleAuditResponse {
  id: number
  saleId?: number | null
  userId?: string | null
  actionType: SaleAuditAction
  description?: string | null
  createdAt: string
}

export interface SaleResponse {
  id: number
  saleNumber: string
  saleDate: string
  subtotal: number
  discountPercentage?: number | null
  discountAmount?: number | null
  grandTotal: number
  status: SaleStatus
  cancellationReason?: CancellationReason | null
  cancellationDescription?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  items: SaleItemResponse[]
  payment?: SalePaymentResponse | null
  createdAt: string
  updatedAt: string
}

export interface SaleRequest {
  saleDate?: string
  items: SaleItemRequest[]
  discountPercentage?: number
  discountAmount?: number
  paymentMethod?: PaymentMethod
  paymentDescription?: string
}

export interface SaleEditRequest {
  saleDate?: string
  items: SaleItemRequest[]
  discountPercentage?: number
  discountAmount?: number
  paymentMethod?: PaymentMethod
  paymentDescription?: string
  reducePaymentOnTotalDecrease?: boolean
}

export interface SaleCancelRequest {
  reason: CancellationReason
  description?: string
}
