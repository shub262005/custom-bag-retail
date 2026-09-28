import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type {
  DailySalesReportResponse,
  DateRangeSalesReportResponse,
  ProductSalesReportResponse,
  CategorySalesReportResponse,
  PaymentMethodSalesReportResponse,
  CancelledSalesReportResponse,
} from '../../types'
import { SALES_QUERY_KEY } from '../sales/useSales'

export const REPORTS_QUERY_KEY = [...SALES_QUERY_KEY, 'reports'] as const

export interface ReportDateRangeParams {
  startDate?: string
  endDate?: string
}

function cleanDateParams(params?: ReportDateRangeParams): Record<string, string> {
  const cleaned: Record<string, string> = {}
  if (params?.startDate?.trim()) cleaned.startDate = params.startDate.trim()
  if (params?.endDate?.trim()) cleaned.endDate = params.endDate.trim()
  return cleaned
}

export function useDailySalesReport(date?: string) {
  const trimmed = date?.trim()
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'daily', trimmed || 'today'],
    queryFn: async () => {
      const params = trimmed ? { date: trimmed } : undefined
      const response = await axiosClient.get<DailySalesReportResponse>('/sales/reports/daily', { params })
      return response.data
    },
  })
}

export function useDateRangeSalesReport(params?: ReportDateRangeParams, options?: { enabled?: boolean }) {
  const cleaned = cleanDateParams(params)
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'date-range', cleaned],
    queryFn: async () => {
      const response = await axiosClient.get<DateRangeSalesReportResponse>('/sales/reports/date-range', {
        params: cleaned,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useProductSalesReport(params?: ReportDateRangeParams, options?: { enabled?: boolean }) {
  const cleaned = cleanDateParams(params)
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'products', cleaned],
    queryFn: async () => {
      const response = await axiosClient.get<ProductSalesReportResponse[]>('/sales/reports/by-product', {
        params: cleaned,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCategorySalesReport(params?: ReportDateRangeParams, options?: { enabled?: boolean }) {
  const cleaned = cleanDateParams(params)
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'categories', cleaned],
    queryFn: async () => {
      const response = await axiosClient.get<CategorySalesReportResponse[]>('/sales/reports/by-category', {
        params: cleaned,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function usePaymentMethodSalesReport(params?: ReportDateRangeParams, options?: { enabled?: boolean }) {
  const cleaned = cleanDateParams(params)
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'payments', cleaned],
    queryFn: async () => {
      const response = await axiosClient.get<PaymentMethodSalesReportResponse[]>('/sales/reports/by-payment-method', {
        params: cleaned,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCancelledSalesReport(params?: ReportDateRangeParams, options?: { enabled?: boolean }) {
  const cleaned = cleanDateParams(params)
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'cancelled', cleaned],
    queryFn: async () => {
      const response = await axiosClient.get<CancelledSalesReportResponse[]>('/sales/reports/cancelled', {
        params: cleaned,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}
