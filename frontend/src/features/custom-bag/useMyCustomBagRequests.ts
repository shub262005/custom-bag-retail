import { useQuery } from '@tanstack/react-query'
import { getMyCustomBagLogo, getMyCustomBagRequest, getMyCustomBagRequests } from './customBagRequestApi'

export const MY_CUSTOM_BAGS_KEY = ['custom-bag-requests', 'mine'] as const

export function useMyCustomBagRequests() {
  return useQuery({ queryKey: MY_CUSTOM_BAGS_KEY, queryFn: getMyCustomBagRequests })
}

export function useMyCustomBagRequest(id: number) {
  return useQuery({
    queryKey: [...MY_CUSTOM_BAGS_KEY, id],
    queryFn: () => getMyCustomBagRequest(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useMyCustomBagLogo(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...MY_CUSTOM_BAGS_KEY, id, 'logo'],
    queryFn: () => getMyCustomBagLogo(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    retry: false,
  })
}
