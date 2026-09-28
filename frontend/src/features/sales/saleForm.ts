import type { PaymentMethod } from '../../types/common.types'
export const cancellationOptions = [
  { value: 'CUSTOMER_RETURNED_ITEM', label: 'Customer Returned Item' },
  { value: 'WRONG_SALE_ENTRY', label: 'Wrong Sale Entry' },
  { value: 'DUPLICATE_SALE', label: 'Duplicate Sale' },
  { value: 'BILLING_MISTAKE', label: 'Billing Mistake' },
  { value: 'OTHER', label: 'Other' },
]
export const paymentOptions = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'].map(value => ({ value, label: value === 'BANK_TRANSFER' ? 'Bank Transfer' : value === 'OTHER' ? 'Other' : value }))
export const paymentLabel = (method?: PaymentMethod | null) => method ? paymentOptions.find(p => p.value === method)?.label : 'Not specified'
export function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
