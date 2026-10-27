import type { ProductResponse } from '../../types/product.types'

const identifier = (value: string | null | undefined) => value?.trim().toLowerCase()

// Registration accepts new codes, while excluding the product currently being edited.
export function validateRegistrationCode(products: ProductResponse[], raw: string, editingId?: number, currentBarcode = ''): { code?: string; error?: string } {
  const code = raw.trim()
  if (!code || code.length > 50) return { error: 'Scan a product SKU or barcode of up to 50 characters.' }
  const existing = products.find(p => p.id !== editingId && (identifier(p.barcode) === identifier(code) || identifier(p.sku) === identifier(code)))
  if (existing) return { error: `Code "${code}" is already registered to ${existing.name} (${existing.sku}).` }
  if (editingId === undefined && currentBarcode.trim() && identifier(currentBarcode) !== identifier(code)) {
    return { error: 'Finish the current product on the PC and choose Save & Add Another before scanning the next product. Clear the Barcode field to replace its code.' }
  }
  return { code }
}

// Match full identifiers without case sensitivity, consistent with backend lookups.
export function resolveProductScan(products: ProductResponse[], raw: string) {
  const code = raw.trim()
  if (!code || code.length > 50) return { error: 'Scan a product SKU or barcode of up to 50 characters.' }
  const matches = products.filter(p => identifier(p.sku) === identifier(code) || identifier(p.barcode) === identifier(code))
  if (!matches.length) return { error: `Product not found for code "${code}". Check its SKU or barcode in Products.` }
  if (matches.length > 1) return { error: 'This code matches multiple products. Give each product a distinct SKU/barcode before scanning.' }
  if (matches[0].status !== 'ACTIVE') return { error: 'This product is inactive and cannot be added.' }
  return { product: matches[0] }
}
