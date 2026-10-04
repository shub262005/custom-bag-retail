import { axiosClient } from './axiosClient'

export interface StorefrontItem {
  id: number
  name: string
}

export const storefrontApi = {
  async getBrands(): Promise<StorefrontItem[]> {
    const response = await axiosClient.get<StorefrontItem[]>('/public/storefront/brands')
    return response.data
  },

  async getCategories(): Promise<StorefrontItem[]> {
    const response = await axiosClient.get<StorefrontItem[]>('/public/storefront/categories')
    return response.data
  },
}
