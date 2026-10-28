import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type {
  CustomerRequest,
  CustomerResponse,
  CustomerRepaymentRequest,
  CustomerRepaymentResponse,
  SaleResponse,
} from '../../types'
import { SALES_QUERY_KEY } from '../sales/useSales'

export const CUSTOMERS_QUERY_KEY = ['customers'] as const

export function useCustomers(params?: { search?: string; status?: string }) {
  const search = params?.search?.trim()
  const status = params?.status?.trim()

  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'list', { search, status }],
    queryFn: async () => {
      const response = await axiosClient.get<CustomerResponse[]>('/customers', {
        params: {
          search: search || undefined,
          status: status || undefined,
        },
      })
      return response.data
    },
  })
}

export function useCustomer(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      const response = await axiosClient.get<CustomerResponse>(`/customers/${id}`)
      return response.data
    },
    enabled: (options?.enabled ?? true) && Number.isSafeInteger(id) && id > 0,
  })
}

export function useCustomerSales(customerId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'sales', customerId],
    queryFn: async () => {
      const response = await axiosClient.get<SaleResponse[]>(`/customers/${customerId}/sales`)
      return response.data
    },
    enabled: (options?.enabled ?? true) && Number.isSafeInteger(customerId) && customerId > 0,
  })
}

export function useCustomerRepayments(customerId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'repayments', customerId],
    queryFn: async () => {
      const response = await axiosClient.get<CustomerRepaymentResponse[]>(
        `/customers/${customerId}/repayments`
      )
      return response.data
    },
    enabled: (options?.enabled ?? true) && Number.isSafeInteger(customerId) && customerId > 0,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomerRequest) => {
      const response = await axiosClient.post<CustomerResponse>('/customers', data)
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerRequest }) => {
      const response = await axiosClient.put<CustomerResponse>(`/customers/${id}`, data)
      return response.data
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: [...CUSTOMERS_QUERY_KEY, 'detail', variables.id] }),
      ])
    },
  })
}

export function useRecordCustomerRepayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomerRepaymentRequest) => {
      const response = await axiosClient.post<CustomerRepaymentResponse>(
        '/customers/repayments',
        data
      )
      return response.data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY }),
      ])
    },
  })
}
