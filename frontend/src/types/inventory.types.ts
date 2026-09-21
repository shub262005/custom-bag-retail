import type { TransactionType } from './common.types'

export interface InventoryTransactionResponse {
  id: number
  productId: number
  productName: string
  productSku: string
  transactionType: TransactionType
  quantity: number
  quantityBefore: number
  quantityAfter: number
  reason?: string | null
  referenceType?: string | null
  referenceId?: string | null
  movementDate: string
  createdAt: string
}

export interface InventoryTransactionRequest {
  productId: number
  transactionType: TransactionType
  quantity: number
  reason?: string
  referenceType?: string
  referenceId?: string
  movementDate?: string
}

export interface InventoryTransactionFilterParams {
  productId?: number
  transactionType?: TransactionType
  startDate?: string
  endDate?: string
}
