import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { PRODUCTS_QUERY_KEY } from '../products/useProducts'
import type {
  InventoryTransactionResponse,
  InventoryTransactionRequest,
  InventoryTransactionFilterParams,
} from '../../types'

export const INVENTORY_QUERY_KEY = ['inventory-transactions']

export function useInventoryTransactions(filters: InventoryTransactionFilterParams = {}) {
  const { productId, transactionType, startDate, endDate } = filters

  return useQuery({
    queryKey: [
      ...INVENTORY_QUERY_KEY,
      'list',
      {
        productId: productId || null,
        transactionType: transactionType || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (productId) params.productId = productId
      if (transactionType) params.transactionType = transactionType
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await axiosClient.get<InventoryTransactionResponse[]>(
        '/inventory-transactions',
        { params }
      )
      return response.data
    },
  })
}

export function useProductInventoryTransactions(productId: number | null) {
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY, 'product', productId],
    queryFn: async () => {
      if (!productId) return []
      const response = await axiosClient.get<InventoryTransactionResponse[]>(
        `/inventory-transactions/product/${productId}`
      )
      return response.data
    },
    enabled: !!productId,
  })
}

export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InventoryTransactionRequest) => {
      const response = await axiosClient.post<InventoryTransactionResponse>(
        '/inventory-transactions',
        data
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate both inventory transactions and product stock lists
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })
}
