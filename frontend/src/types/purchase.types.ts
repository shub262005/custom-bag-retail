import type { PaymentMethod, PaymentStatus, PurchaseStatus } from './common.types'
import type { SupplierResponse } from './supplier.types'

export interface PurchaseItemResponse {
  id: number
  productId: number
  productName: string
  productSku: string
  quantity: number
  purchasePrice: number
  itemTotal: number
}

export interface PurchaseItemRequest {
  productId: number
  quantity: number
  purchasePrice: number
}

export interface PurchasePaymentResponse {
  id: number
  amount: number
  paymentMethod: PaymentMethod
  paymentReference?: string | null
  paymentDate: string
  notes?: string | null
  createdAt: string
}

export interface PurchasePaymentRequest {
  amount: number
  paymentMethod: PaymentMethod
  paymentReference?: string
  paymentDate: string
  notes?: string
}

export interface PurchaseResponse {
  id: number
  purchaseNumber: string
  supplier?: SupplierResponse | null
  purchaseDate: string
  invoiceNumber?: string | null
  invoiceDate?: string | null
  subtotal: number
  discountPercentage?: number | null
  discountAmount?: number | null
  taxRate?: number | null
  taxAmount?: number | null
  grandTotal: number
  status: PurchaseStatus
  notes?: string | null
  items: PurchaseItemResponse[]
  payments: PurchasePaymentResponse[]
  totalPaid: number
  outstandingAmount: number
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface PurchaseRequest {
  supplierId: number
  purchaseDate: string
  invoiceNumber?: string
  invoiceDate?: string
  discountPercentage?: number
  discountAmount?: number
  taxRate?: number
  notes?: string
  items: PurchaseItemRequest[]
  payments?: PurchasePaymentRequest[]
}
