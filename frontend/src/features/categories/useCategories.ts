import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import type { CategoryResponse, CategoryRequest, CategoryStatus } from '../../types'

export const CATEGORIES_QUERY_KEY = ['categories']

export function useCategories(status?: CategoryStatus) {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, status ?? 'ALL'],
    queryFn: async () => {
      const params = status ? { status } : undefined
      const response = await axiosClient.get<CategoryResponse[]>('/categories', { params })
      return response.data
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryRequest) => {
      const response = await axiosClient.post<CategoryResponse>('/categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryRequest }) => {
      const response = await axiosClient.put<CategoryResponse>(`/categories/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })

  const activateCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosClient.patch<CategoryResponse>(`/categories/${id}/activate`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })

  const deactivateCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosClient.patch<CategoryResponse>(`/categories/${id}/deactivate`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })

  return {
    categoriesQuery,
    createCategoryMutation,
    updateCategoryMutation,
    activateCategoryMutation,
    deactivateCategoryMutation,
  }
}
