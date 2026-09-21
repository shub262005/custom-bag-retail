import type { CancellationReason, PaymentMethod } from './common.types'
import type { SaleItemResponse } from './sale.types'

export interface DailySalesReportResponse {
  date: string
  totalSalesCount: number
  totalSalesAmount: number
}

export interface DateRangeSalesReportResponse {
  startDate: string
  endDate: string
  totalSalesCount: number
  totalSalesAmount: number
  dailyBreakdown: DailySalesReportResponse[]
}

export interface ProductSalesReportResponse {
  productId: number
  productName: string
  sku: string
  quantitySold: number
  salesAmount: number
}

export interface CategorySalesReportResponse {
  categoryId: number
  categoryName: string
  quantitySold: number
  salesAmount: number
}

export interface PaymentMethodSalesReportResponse {
  paymentMethod: PaymentMethod
  salesCount: number
  totalAmount: number
}

export interface CancelledSalesReportResponse {
  saleId: number
  saleNumber: string
  saleDate: string
  grandTotal: number
  cancellationReason: CancellationReason
  cancellationDescription?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  items: SaleItemResponse[]
}

export interface SalesDashboardResponse {
  date: string
  todayCompletedSalesCount: number
  todayCompletedSalesAmount: number
  todayCancelledSalesCount: number
  salesByPaymentMethod: PaymentMethodSalesReportResponse[]
  topSellingProducts: ProductSalesReportResponse[]
}
