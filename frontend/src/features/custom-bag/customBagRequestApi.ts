import { axiosClient } from '../../api/axiosClient'
import type { BagConfiguration } from './three/bagConfiguration'

export type CustomBagRequestStatus = 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export interface CustomBagRequestSummary {
  id: number
  requestNumber: string
  bagType: BagConfiguration['bagType']
  material: BagConfiguration['material']
  bodyColor: BagConfiguration['bodyColor']
  estimatedPrice: number
  status: CustomBagRequestStatus
  createdAt: string
  updatedAt: string
}

export interface CustomBagAdminSummary extends Omit<CustomBagRequestSummary, 'bodyColor'> {
  customer: { id: number; name: string; email: string }
}

export interface CustomBagRequestResponse {
  id: number
  requestNumber: string
  estimatedPrice: number
  status: 'SUBMITTED'
  logoReference?: string | null
  createdAt: string
}

export interface CustomBagRequestDetail extends Omit<CustomBagRequestResponse, 'status'> {
  status: CustomBagRequestStatus
  customer: { id: number; name: string; email: string }
  requestType: 'STANDARD' | 'SPECIAL_DESIGN'
  bagType: BagConfiguration['bagType']
  size: BagConfiguration['size']
  material: BagConfiguration['material']
  bodyColor: BagConfiguration['bodyColor']
  pocketColor: BagConfiguration['pocketColor']
  strapColor: BagConfiguration['strapColor']
  frontPocket: boolean
  sidePockets: boolean
  compartmentCount: BagConfiguration['compartmentCount']
  laptopPadding: boolean
  waterResistant: boolean
  logoPosition: BagConfiguration['logoPosition'] | null
  customText: string | null
  textColor: BagConfiguration['textColor'] | null
  textPosition: BagConfiguration['textPosition'] | null
  customerNotes: string | null
  adminNote: string | null
  updatedAt: string
}

export async function submitCustomBagRequest(
  configuration: BagConfiguration,
  customerNotes: string,
  logoFile: File | null,
) {
  const request = {
    requestType: 'STANDARD',
    bagType: configuration.bagType,
    size: configuration.size,
    material: configuration.material,
    bodyColor: configuration.bodyColor,
    pocketColor: configuration.pocketColor,
    strapColor: configuration.strapColor,
    frontPocket: configuration.frontPocket,
    sidePockets: configuration.sidePockets,
    compartmentCount: configuration.compartmentCount,
    laptopPadding: configuration.laptopPadding,
    waterResistant: configuration.waterResistant,
    logoPosition: logoFile ? configuration.logoPosition : null,
    customText: configuration.customText.trim() || null,
    textColor: configuration.customText.trim() ? configuration.textColor : null,
    textPosition: configuration.customText.trim() ? configuration.textPosition : null,
    customerNotes: customerNotes.trim() || null,
  }
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  if (logoFile) form.append('logo', logoFile)
  const response = await axiosClient.post<CustomBagRequestResponse>('/custom-bag-requests', form)
  return response.data
}

export const getMyCustomBagRequests = async () =>
  (await axiosClient.get<CustomBagRequestSummary[]>('/custom-bag-requests/mine')).data

export const getMyCustomBagRequest = async (id: number) =>
  (await axiosClient.get<CustomBagRequestDetail>(`/custom-bag-requests/mine/${id}`)).data

export const getMyCustomBagLogo = async (id: number) =>
  (await axiosClient.get<Blob>(`/custom-bag-requests/mine/${id}/logo`, { responseType: 'blob' })).data

export interface AdminRequestFilters { status?: CustomBagRequestStatus | ''; requestNumber?: string; customer?: string }

export const getAdminCustomBagRequests = async (filters: AdminRequestFilters) =>
  (await axiosClient.get<CustomBagAdminSummary[]>('/custom-bag-requests/admin', { params: filters })).data
export const getAdminCustomBagRequest = async (id: number) =>
  (await axiosClient.get<CustomBagRequestDetail>(`/custom-bag-requests/admin/${id}`)).data
export const getAdminCustomBagLogo = async (id: number) =>
  (await axiosClient.get<Blob>(`/custom-bag-requests/admin/${id}/logo`, { responseType: 'blob' })).data
export const updateAdminCustomBagRequest = async (id: number, status: CustomBagRequestStatus, adminNote: string) =>
  (await axiosClient.patch<CustomBagRequestDetail>(`/custom-bag-requests/admin/${id}`, { status, adminNote: adminNote.trim() || null })).data
