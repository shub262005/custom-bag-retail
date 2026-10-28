import type { PaymentMethod } from './common.types'

export type CustomerStatus = 'ACTIVE' | 'INACTIVE'

export interface CustomerResponse {
  id: number
  name: string
  phone: string
  email?: string | null
  address?: string | null
  status: CustomerStatus
  totalPurchasesCount: number
  totalPurchasesAmount: number
  totalPaidAmount: number
  totalDueAmount: number
  totalRepaidAmount: number
  createdAt: string
  updatedAt: string
}

export interface CustomerRequest {
  name: string
  phone: string
  email?: string | null
  address?: string | null
  status?: CustomerStatus
}

export interface CustomerRepaymentRequest {
  customerId?: number
  saleId?: number
  amount: number
  paymentMethod: PaymentMethod
  repaymentDate?: string
  notes?: string
}

export interface CustomerRepaymentResponse {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  saleId?: number | null
  saleNumber?: string | null
  amount: number
  paymentMethod: PaymentMethod
  repaymentDate: string
  notes?: string | null
  receivedBy: string
  createdAt: string
}
