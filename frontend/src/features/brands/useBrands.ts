import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type { BrandResponse, BrandRequest, BrandStatus, BrandStatusUpdateRequest } from '../../types'

export const BRANDS_QUERY_KEY = ['brands']

export function useBrands(status?: BrandStatus) {
  const queryClient = useQueryClient()

  const brandsQuery = useQuery({
    queryKey: [...BRANDS_QUERY_KEY, status ?? 'ALL'],
    queryFn: async () => {
      const params = status ? { status } : undefined
      const response = await axiosClient.get<BrandResponse[]>('/brands', { params })
      return response.data
    },
  })

  const createBrandMutation = useMutation({
    mutationFn: async (data: BrandRequest) => {
      const response = await axiosClient.post<BrandResponse>('/brands', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY })
    },
  })

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BrandRequest }) => {
      const response = await axiosClient.put<BrandResponse>(`/brands/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY })
    },
  })

  const updateBrandStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BrandStatus }) => {
      const payload: BrandStatusUpdateRequest = { status }
      const response = await axiosClient.patch<BrandResponse>(`/brands/${id}/status`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY })
    },
  })

  return {
    brandsQuery,
    createBrandMutation,
    updateBrandMutation,
    updateBrandStatusMutation,
  }
}
