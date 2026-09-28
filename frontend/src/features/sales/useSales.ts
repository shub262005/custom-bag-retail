import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type { SaleResponse, SaleRequest, SaleEditRequest, SaleCancelRequest, SaleFilterParams, SaleAuditResponse } from '../../types/sale.types'
import type { InventoryTransactionResponse } from '../../types/inventory.types'
import { PRODUCTS_QUERY_KEY } from '../products/useProducts'
import { INVENTORY_QUERY_KEY } from '../inventory/useInventory'

export const SALES_QUERY_KEY = ['sales'] as const
export const validSaleId = (id: number) => Number.isSafeInteger(id) && id > 0
export function useSales(filters: SaleFilterParams = {}, options?: { enabled?: boolean }) {
  const params = Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      .map(([key, value]) => [key, (value as string).trim()])
  )
  return useQuery({
    queryKey: [...SALES_QUERY_KEY, 'list', params],
    queryFn: async () => (await axiosClient.get<SaleResponse[]>('/sales', { params })).data,
    enabled: options?.enabled ?? true,
  })
}
export function useSale(id: number) {
  return useQuery({ queryKey: [...SALES_QUERY_KEY, 'detail', id], enabled: validSaleId(id), queryFn: async () => (await axiosClient.get<SaleResponse>(`/sales/${id}`)).data })
}
export function useSaleByNumber(number: string) {
  return useQuery({ queryKey: [...SALES_QUERY_KEY, 'number', number.trim()], enabled: !!number.trim(), queryFn: async () => (await axiosClient.get<SaleResponse>(`/sales/number/${encodeURIComponent(number.trim())}`)).data })
}
export function useSaleInventory(id: number) {
  return useQuery({ queryKey: [...SALES_QUERY_KEY, 'inventory', id], enabled: validSaleId(id), queryFn: async () => (await axiosClient.get<InventoryTransactionResponse[]>(`/sales/${id}/inventory-transactions`)).data })
}
export function useSaleAudit(id: number) {
  return useQuery({ queryKey: [...SALES_QUERY_KEY, 'audit', id], enabled: validSaleId(id), queryFn: async () => (await axiosClient.get<SaleAuditResponse[]>(`/sales/${id}/audit-history`)).data })
}
function useSaleMutation<T>(send: (variables: T) => Promise<SaleResponse>) {
  const client = useQueryClient()
  return useMutation({ mutationFn: send, onSuccess: async (sale) => {
    client.setQueryData([...SALES_QUERY_KEY, 'detail', sale.id], sale)
    await Promise.all([
      client.invalidateQueries({ queryKey: SALES_QUERY_KEY }),
      client.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
      client.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
    ])
  } })
}
export const useCreateSale = () => useSaleMutation(async (data: SaleRequest) => (await axiosClient.post<SaleResponse>('/sales', data)).data)
export const useUpdateSale = () => useSaleMutation(async ({ id, data }: { id: number; data: SaleEditRequest }) => (await axiosClient.put<SaleResponse>(`/sales/${id}`, data)).data)
export const useCancelSale = () => useSaleMutation(async ({ id, data }: { id: number; data: SaleCancelRequest }) => (await axiosClient.patch<SaleResponse>(`/sales/${id}/cancel`, data)).data)
