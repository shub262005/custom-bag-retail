import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveProductScan, validateRegistrationCode } from '../src/components/products/productScan.ts'

const bag = { id: 1, name: 'Bag', sku: 'BAG-001', barcode: '8901234567890', status: 'ACTIVE' }

test('QR SKU and barcode identify the same product, trimming scanner whitespace', () => {
  assert.equal(resolveProductScan([bag], 'BAG-001\r\n').product, bag)
  assert.equal(resolveProductScan([bag], '8901234567890').product, bag)
})

test('partial names, unknown codes and oversized payloads cannot add a product', () => {
  for (const code of ['Bag', 'BAG', '', 'https://example.com/product', 'a'.repeat(51)]) {
    assert.ok(resolveProductScan([bag], code).error)
  }
})

test('inactive products and cross-field identifier collisions are rejected', () => {
  assert.ok(resolveProductScan([{ ...bag, status: 'INACTIVE' }], bag.sku).error)
  assert.ok(resolveProductScan([bag, { ...bag, id: 2, sku: 'OTHER', barcode: bag.sku }], bag.sku).error)
})

test('registration accepts an unknown code and trims scanner suffixes', () => {
  assert.deepEqual(validateRegistrationCode([bag], ' NEW-BAG-002\r\n'), { code: 'NEW-BAG-002' })
  assert.ok(resolveProductScan([bag], 'NEW-BAG-002').error)
})

test('registration rejects identifiers already assigned to active or inactive products', () => {
  for (const status of ['ACTIVE', 'INACTIVE']) {
    const products = [{ ...bag, status }]
    assert.match(validateRegistrationCode(products, bag.barcode).error, /already registered to Bag/)
    assert.match(validateRegistrationCode(products, bag.sku).error, /already registered to Bag/)
  }
})

test('editing preserves own identifiers while rejecting another product code', () => {
  const products = [bag, { ...bag, id: 2, sku: 'OTHER', barcode: 'OTHER-BARCODE' }]
  assert.deepEqual(validateRegistrationCode(products, bag.barcode, bag.id), { code: bag.barcode })
  assert.deepEqual(validateRegistrationCode(products, bag.sku, bag.id), { code: bag.sku })
  assert.ok(validateRegistrationCode(products, 'OTHER-BARCODE', bag.id).error)
})

test('registration rejects empty or oversized codes without truncating them', () => {
  for (const code of ['', '\r\n', 'a'.repeat(51)]) assert.ok(validateRegistrationCode([], code).error)
  assert.equal(validateRegistrationCode([], 'a'.repeat(50)).code.length, 50)
})

test('next registration scan cannot overwrite an unsaved product code', () => {
  assert.match(validateRegistrationCode([], 'NEXT-BAG', undefined, 'CURRENT-BAG').error, /Save & Add Another/)
  assert.deepEqual(validateRegistrationCode([], 'CURRENT-BAG', undefined, 'CURRENT-BAG'), { code: 'CURRENT-BAG' })
  assert.deepEqual(validateRegistrationCode([], 'NEXT-BAG', undefined, ''), { code: 'NEXT-BAG' })
})

test('product editing still permits replacing the current barcode with an unused code', () => {
  assert.deepEqual(validateRegistrationCode([bag], 'NEW-BARCODE', bag.id, bag.barcode), { code: 'NEW-BARCODE' })
})

test('identifier case agrees with backend case-insensitive lookup and uniqueness rules', () => {
  const product = { ...bag, barcode: 'Code-ABC' }
  assert.equal(resolveProductScan([product], 'bag-001').product, product)
  assert.equal(resolveProductScan([product], 'code-abc').product, product)
  assert.ok(validateRegistrationCode([product], 'CODE-abc').error)
  assert.ok(validateRegistrationCode([product], 'bag-001').error)
  assert.ok(resolveProductScan([product, { ...bag, id: 2, sku: 'CODE-ABC' }], 'code-abc').error)
})
