import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { PRODUCTS_QUERY_KEY } from '../products/useProducts'
import { INVENTORY_QUERY_KEY } from '../inventory/useInventory'
import type {
  PurchaseResponse,
  PurchaseRequest,
  PurchasePaymentRequest,
  PurchaseFilterParams,
} from '../../types'

export const PURCHASES_QUERY_KEY = ['purchases'] as const

/**
 * Hook to query all purchases with optional backend filters:
 * - supplierId
 * - status (COMPLETED | CANCELLED)
 * - startDate (YYYY-MM-DD)
 * - endDate (YYYY-MM-DD)
 * - search (purchase number, invoice number, supplier name)
 */
export function usePurchases(filters: PurchaseFilterParams = {}) {
  const { supplierId, status, startDate, endDate, search } = filters

  return useQuery({
    queryKey: [
      ...PURCHASES_QUERY_KEY,
      'list',
      {
        supplierId: supplierId || null,
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null,
        search: search?.trim() || null,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (supplierId) params.supplierId = supplierId
      if (status) params.status = status
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (search && search.trim()) params.search = search.trim()

      const response = await axiosClient.get<PurchaseResponse[]>('/purchases', {
        params,
      })
      return response.data
    },
  })
}

/**
 * Hook to query a single purchase by ID.
 */
export function usePurchase(id: number | null | undefined) {
  return useQuery({
    queryKey: [...PURCHASES_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Purchase ID is required')
      const response = await axiosClient.get<PurchaseResponse>(`/purchases/${id}`)
      return response.data
    },
    enabled: typeof id === 'number' && id > 0,
  })
}

/**
 * Hook to query a single purchase by order code (e.g. PUR-2026-000001).
 */
export function usePurchaseByNumber(purchaseNumber: string | null | undefined) {
  const trimmed = purchaseNumber?.trim() || ''

  return useQuery({
    queryKey: [...PURCHASES_QUERY_KEY, 'number', trimmed],
    queryFn: async () => {
      if (!trimmed) throw new Error('Purchase number is required')
      const response = await axiosClient.get<PurchaseResponse>(`/purchases/number/${trimmed}`)
      return response.data
    },
    enabled: trimmed.length > 0,
  })
}

/**
 * Mutation hook to create a new purchase order.
 * On success, invalidates:
 * - purchases (updates purchase list and counts)
 * - products (stock quantities and lastPurchasePrice updated)
 * - inventory-transactions (STOCK_IN ledger transactions recorded)
 */
export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PurchaseRequest) => {
      const response = await axiosClient.post<PurchaseResponse>('/purchases', data)
      return response.data
    },
    onSuccess: (savedPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      // Seed or update the newly created purchase in cache
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', savedPurchase.id], savedPurchase)
    },
  })
}

/**
 * Mutation hook to update an existing purchase order.
 * On success, invalidates purchases, products, and inventory transactions.
 */
export function useUpdatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PurchaseRequest }) => {
      const response = await axiosClient.put<PurchaseResponse>(`/purchases/${id}`, data)
      return response.data
    },
    onSuccess: (updatedPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', updatedPurchase.id], updatedPurchase)
    },
  })
}

/**
 * Mutation hook to cancel a purchase order and reverse its stock quantities.
 * On success, invalidates purchases, products, and inventory transactions.
 */
export function useCancelPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosClient.patch<PurchaseResponse>(`/purchases/${id}/cancel`)
      return response.data
    },
    onSuccess: (cancelledPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', cancelledPurchase.id], cancelledPurchase)
    },
  })
}

/**
 * Mutation hook to record a payment installment for a purchase order.
 * On success, invalidates purchases queries and updates the purchase detail cache.
 */
export function useAddPurchasePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      purchaseId,
      data,
    }: {
      purchaseId: number
      data: PurchasePaymentRequest
    }) => {
      const response = await axiosClient.post<PurchaseResponse>(
        `/purchases/${purchaseId}/payments`,
        data
      )
      return response.data
    },
    onSuccess: (updatedPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', updatedPurchase.id], updatedPurchase)
    },
  })
}

/**
 * Mutation hook to edit an existing payment installment.
 * On success, invalidates purchases queries and updates the purchase detail cache.
 */
export function useUpdatePurchasePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      purchaseId,
      paymentId,
      data,
    }: {
      purchaseId: number
      paymentId: number
      data: PurchasePaymentRequest
    }) => {
      const response = await axiosClient.put<PurchaseResponse>(
        `/purchases/${purchaseId}/payments/${paymentId}`,
        data
      )
      return response.data
    },
    onSuccess: (updatedPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', updatedPurchase.id], updatedPurchase)
    },
  })
}

/**
 * Mutation hook to delete a payment installment.
 * On success, invalidates purchases queries and updates the purchase detail cache.
 */
export function useDeletePurchasePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      purchaseId,
      paymentId,
    }: {
      purchaseId: number
      paymentId: number
    }) => {
      const response = await axiosClient.delete<PurchaseResponse>(
        `/purchases/${purchaseId}/payments/${paymentId}`
      )
      return response.data
    },
    onSuccess: (updatedPurchase) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.setQueryData([...PURCHASES_QUERY_KEY, 'detail', updatedPurchase.id], updatedPurchase)
    },
  })
}
