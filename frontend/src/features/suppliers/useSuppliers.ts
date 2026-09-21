import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type {
  SupplierResponse,
  SupplierRequest,
  SupplierStatus,
  SupplierStatusUpdateRequest,
} from '../../types'

export const SUPPLIERS_QUERY_KEY = ['suppliers']

export interface UseSuppliersOptions {
  status?: SupplierStatus | ''
  searchQuery?: string
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const queryClient = useQueryClient()
  const { status, searchQuery } = options
  const trimmedSearch = searchQuery?.trim() || ''

  const isSearching = trimmedSearch.length > 0

  const suppliersQuery = useQuery({
    queryKey: isSearching
      ? [...SUPPLIERS_QUERY_KEY, 'search', trimmedSearch, status || 'ALL']
      : [...SUPPLIERS_QUERY_KEY, 'list', status || 'ALL'],
    queryFn: async () => {
      if (isSearching) {
        // Backend search endpoint /api/v1/suppliers/search?q=...
        const response = await axiosClient.get<SupplierResponse[]>('/suppliers/search', {
          params: { q: trimmedSearch },
        })
        const results = response.data
        // /search endpoint does not accept a status parameter on the backend;
        // apply the status filter client-side to the returned search results.
        if (status) {
          return results.filter((supplier) => supplier.status === status)
        }
        return results
      } else {
        // Backend list endpoint /api/v1/suppliers?status=...
        const params = status ? { status } : undefined
        const response = await axiosClient.get<SupplierResponse[]>('/suppliers', { params })
        return response.data
      }
    },
  })

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierRequest) => {
      const response = await axiosClient.post<SupplierResponse>('/suppliers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
    },
  })

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SupplierRequest }) => {
      const response = await axiosClient.put<SupplierResponse>(`/suppliers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
    },
  })

  const updateSupplierStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SupplierStatus }) => {
      const payload: SupplierStatusUpdateRequest = { status }
      const response = await axiosClient.patch<SupplierResponse>(`/suppliers/${id}/status`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
    },
  })

  return {
    suppliersQuery,
    isSearching,
    createSupplierMutation,
    updateSupplierMutation,
    updateSupplierStatusMutation,
  }
}
