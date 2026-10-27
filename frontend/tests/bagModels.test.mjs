import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_BAG_CONFIGURATION } from '../src/features/custom-bag/three/bagConfiguration.ts'
import { BAG_TEMPLATES, normalizeConfigurationForTemplate } from '../src/features/custom-bag/three/bagTemplates.ts'
import { calculateBagPrice } from '../src/features/custom-bag/three/bagPricing.ts'

test('switching from backpack to tote/sling removes unsupported features and compartments', () => {
  for (const bagType of ['TOTE_BAG', 'SLING_BAG']) {
    const config = normalizeConfigurationForTemplate({ ...DEFAULT_BAG_CONFIGURATION, compartmentCount: 4, laptopPadding: true, sidePockets: true, customText: 'MY BAG' }, bagType)
    assert.equal(config.bagType, bagType)
    assert.equal(config.compartmentCount, 1)
    assert.equal(config.sidePockets, false)
    assert.equal(config.laptopPadding, false)
    assert.equal(config.customText, 'MY BAG')
    assert.equal(config.bodyColor, DEFAULT_BAG_CONFIGURATION.bodyColor)
  }
})

test('tote/sling frontend estimates match server fixtures including all supported upgrades', () => {
  for (const [bagType, expected] of [['TOTE_BAG', 1850], ['SLING_BAG', 1950]]) {
    const config = { ...DEFAULT_BAG_CONFIGURATION, bagType, size: 'MEDIUM', material: 'CANVAS', compartmentCount: 2, frontPocket: true, sidePockets: false, laptopPadding: false, waterResistant: true, customText: 'ROOPAM', logoImage: 'logo.png' }
    assert.equal(calculateBagPrice(config).total, expected)
    assert.equal(BAG_TEMPLATES[bagType].supportsFrontPocket, true)
  }
})

test('all model defaults normalize and produce finite estimates', () => {
  for (const template of Object.values(BAG_TEMPLATES)) {
    const config = normalizeConfigurationForTemplate({ ...DEFAULT_BAG_CONFIGURATION, ...template.defaults }, template.id)
    assert.ok(Number.isFinite(calculateBagPrice(config).total))
    assert.ok(calculateBagPrice(config).total >= template.basePrice)
  }
})
