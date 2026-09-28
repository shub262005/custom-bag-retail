import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type { SalesDashboardResponse } from '../../types'
import { SALES_QUERY_KEY } from '../sales/useSales'

export function useSalesDashboard(date?: string) {
  const trimmedDate = date?.trim()

  return useQuery({
    queryKey: [...SALES_QUERY_KEY, 'dashboard', trimmedDate || 'today'],
    queryFn: async () => {
      const params = trimmedDate ? { date: trimmedDate } : undefined
      const response = await axiosClient.get<SalesDashboardResponse>('/sales/dashboard', {
        params,
      })
      return response.data
    },
  })
}
