// Common Enums matching backend entities

export type ProductStatus = 'ACTIVE' | 'INACTIVE'
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'
export type BrandStatus = 'ACTIVE' | 'INACTIVE'
export type SupplierStatus = 'ACTIVE' | 'INACTIVE'

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'

export type PurchaseStatus = 'COMPLETED' | 'CANCELLED'
export type SaleStatus = 'COMPLETED' | 'CANCELLED'

export type CancellationReason =
  | 'CUSTOMER_RETURNED_ITEM'
  | 'WRONG_SALE_ENTRY'
  | 'DUPLICATE_SALE'
  | 'BILLING_MISTAKE'
  | 'OTHER'

export type SaleAuditAction = 'SALE_CREATED' | 'SALE_UPDATED' | 'SALE_CANCELLED'

export interface BackendErrorResponse {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  validationErrors?: Record<string, string>
}
