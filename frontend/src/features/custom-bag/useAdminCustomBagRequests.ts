import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminCustomBagLogo, getAdminCustomBagRequest, getAdminCustomBagRequests, updateAdminCustomBagRequest, type AdminRequestFilters, type CustomBagRequestStatus } from './customBagRequestApi'

export const ADMIN_CUSTOM_BAGS_KEY = ['custom-bag-requests', 'admin'] as const
export function useAdminCustomBagRequests(filters: AdminRequestFilters) {
  return useQuery({ queryKey: [...ADMIN_CUSTOM_BAGS_KEY, 'list', filters], queryFn: () => getAdminCustomBagRequests(filters) })
}
export function useAdminCustomBagRequest(id: number) {
  return useQuery({ queryKey: [...ADMIN_CUSTOM_BAGS_KEY, 'detail', id], queryFn: () => getAdminCustomBagRequest(id), enabled: id > 0 })
}
export function useAdminCustomBagLogo(id: number, enabled: boolean) {
  return useQuery({ queryKey: [...ADMIN_CUSTOM_BAGS_KEY, 'logo', id], queryFn: () => getAdminCustomBagLogo(id), enabled: enabled && id > 0, retry: false })
}
export function useUpdateAdminCustomBagRequest(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ status, adminNote }: { status: CustomBagRequestStatus; adminNote: string }) => updateAdminCustomBagRequest(id, status, adminNote),
    onSuccess: data => {
      client.setQueryData([...ADMIN_CUSTOM_BAGS_KEY, 'detail', id], data)
      void client.invalidateQueries({ queryKey: [...ADMIN_CUSTOM_BAGS_KEY, 'list'] })
    },
  })
}
