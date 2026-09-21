import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type { ProductResponse, ProductRequest, ProductStatus, ProductStatusUpdateRequest } from '../../types'

export const PRODUCTS_QUERY_KEY = ['products']

export interface UseProductsOptions {
  status?: ProductStatus | ''
  searchQuery?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const queryClient = useQueryClient()
  const { status, searchQuery } = options
  const trimmedSearch = searchQuery?.trim() || ''

  // Query: If there is an active search query, call backend search endpoint /products/search?q=...
  // Otherwise, call list endpoint /products?status=...
  const isSearching = trimmedSearch.length > 0

  const productsQuery = useQuery({
    queryKey: isSearching
      ? [...PRODUCTS_QUERY_KEY, 'search', trimmedSearch]
      : [...PRODUCTS_QUERY_KEY, 'list', status || 'ALL'],
    queryFn: async () => {
      if (isSearching) {
        const response = await axiosClient.get<ProductResponse[]>('/products/search', {
          params: { q: trimmedSearch },
        })
        return response.data
      } else {
        const params = status ? { status } : undefined
        const response = await axiosClient.get<ProductResponse[]>('/products', { params })
        return response.data
      }
    },
  })

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductRequest) => {
      const response = await axiosClient.post<ProductResponse>('/products', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductRequest }) => {
      const response = await axiosClient.put<ProductResponse>(`/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })

  const updateProductStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ProductStatus }) => {
      const payload: ProductStatusUpdateRequest = { status }
      const response = await axiosClient.patch<ProductResponse>(`/products/${id}/status`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })

  return {
    productsQuery,
    isSearching,
    createProductMutation,
    updateProductMutation,
    updateProductStatusMutation,
  }
}
