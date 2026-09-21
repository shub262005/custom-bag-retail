import type { SupplierStatus } from './common.types'

export interface SupplierPhoneResponse {
  id: number
  phoneNumber: string
  label?: string | null
}

export interface SupplierEmailResponse {
  id: number
  email: string
  label?: string | null
}

export interface SupplierResponse {
  id: number
  name: string
  gstNumber?: string | null
  address?: string | null
  status: SupplierStatus
  phones: SupplierPhoneResponse[]
  emails: SupplierEmailResponse[]
  createdAt: string
  updatedAt: string
}

export interface SupplierPhoneRequest {
  phoneNumber: string
  label?: string
}

export interface SupplierEmailRequest {
  email: string
  label?: string
}

export interface SupplierRequest {
  name: string
  gstNumber?: string
  address?: string
  phones?: SupplierPhoneRequest[]
  emails?: SupplierEmailRequest[]
}

export interface SupplierStatusUpdateRequest {
  status: SupplierStatus
}
