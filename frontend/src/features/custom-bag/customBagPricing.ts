import type {
  BagType,
  BagSize,
  BagColor,
  BagMaterial,
  BagStrap,
  ExtraFeature,
  CustomBagConfig,
} from './customBag.types'

export const BAG_TYPE_INFO: Record<
  BagType,
  { label: string; basePrice: number; description: string }
> = {
  BACKPACK: {
    label: 'Backpack',
    basePrice: 800,
    description: 'Ergonomic daily carry for school, college, or daily commute',
  },
  LAPTOP_BAG: {
    label: 'Laptop Bag',
    basePrice: 900,
    description: 'Executive briefcase style with padded computer sleeve',
  },
  SLING_BAG: {
    label: 'Sling Bag',
    basePrice: 600,
    description: 'Lightweight cross-body profile for essentials on the go',
  },
  TRAVEL_BAG: {
    label: 'Travel Bag',
    basePrice: 1200,
    description: 'Heavy-duty weekender holdall with expanded capacity',
  },
  TOTE_BAG: {
    label: 'Tote Bag',
    basePrice: 500,
    description: 'Classic open-top carryall with dual reinforced shoulder drop',
  },
}

export const SIZE_INFO: Record<
  BagSize,
  { label: string; capacity: string; priceDelta: number }
> = {
  SMALL: { label: 'Small', capacity: '15 Litres', priceDelta: 0 },
  MEDIUM: { label: 'Medium', capacity: '25 Litres', priceDelta: 100 },
  LARGE: { label: 'Large', capacity: '35 Litres', priceDelta: 200 },
}

export const COLOR_INFO: Record<
  BagColor,
  { label: string; hex: string; accentHex: string }
> = {
  BLACK: { label: 'Jet Black', hex: '#1e293b', accentHex: '#0f172a' },
  NAVY_BLUE: { label: 'Navy Blue', hex: '#1e3a8a', accentHex: '#172554' },
  RED: { label: 'Crimson Red', hex: '#dc2626', accentHex: '#991b1b' },
  GREEN: { label: 'Forest Green', hex: '#15803d', accentHex: '#14532d' },
  GREY: { label: 'Slate Grey', hex: '#64748b', accentHex: '#334155' },
  BEIGE: { label: 'Desert Beige', hex: '#cbb69d', accentHex: '#8c7355' },
}

export const MATERIAL_INFO: Record<
  BagMaterial,
  { label: string; priceDelta: number; textureDesc: string }
> = {
  CANVAS: { label: 'Canvas', priceDelta: 0, textureDesc: 'Durable heavyweight cotton weave' },
  POLYESTER: { label: 'Polyester', priceDelta: 50, textureDesc: 'Lightweight weather-resistant synthetic' },
  NYLON: { label: 'Nylon', priceDelta: 100, textureDesc: 'Ripstop ballistic high-tensile fabric' },
  LEATHER: { label: 'Leather', priceDelta: 300, textureDesc: 'Premium handcrafted top-grain leather' },
}

export const STRAP_INFO: Record<
  BagStrap,
  { label: string; priceDelta: number; desc: string }
> = {
  STANDARD: { label: 'Standard', priceDelta: 0, desc: 'Webbed nylon strap' },
  PADDED: { label: 'Padded', priceDelta: 50, desc: 'Cushioned mesh shoulder pad' },
  ADJUSTABLE: { label: 'Adjustable', priceDelta: 50, desc: 'Quick-release buckle strap' },
}

export const EXTRA_FEATURES_INFO: Record<
  ExtraFeature,
  { label: string; priceDelta: number; description: string }
> = {
  WATER_RESISTANT: {
    label: 'Water Resistant Coating',
    priceDelta: 150,
    description: 'Hydrophobic protective outer layer',
  },
  EXTRA_POCKET: {
    label: 'Extra Utility Pocket',
    priceDelta: 80,
    description: 'Front quick-access zip pouch',
  },
  LAPTOP_PROTECTION: {
    label: 'Laptop Protection',
    priceDelta: 120,
    description: 'Shock-absorbing padded compartment',
  },
  BOTTLE_HOLDER: {
    label: 'Bottle Holder',
    priceDelta: 60,
    description: 'Elasticated side mesh sleeve',
  },
  CUSTOM_NAME_TAG: {
    label: 'Custom Name Tag',
    priceDelta: 50,
    description: 'Stitched leather identity patch',
  },
}

export interface PriceBreakdownItem {
  label: string
  amount: number
}

export interface PriceCalculationResult {
  total: number
  basePrice: number
  breakdown: PriceBreakdownItem[]
}

export function calculateEstimatedPrice(config: CustomBagConfig): PriceCalculationResult {
  const breakdown: PriceBreakdownItem[] = []

  // 1. Base Bag Type
  const typeInfo = BAG_TYPE_INFO[config.bagType]
  const basePrice = typeInfo.basePrice
  breakdown.push({ label: `${typeInfo.label} (Base)`, amount: basePrice })

  // 2. Size
  const sizeInfo = SIZE_INFO[config.size]
  if (sizeInfo.priceDelta > 0) {
    breakdown.push({ label: `Size: ${sizeInfo.label}`, amount: sizeInfo.priceDelta })
  }

  // 3. Material
  const materialInfo = MATERIAL_INFO[config.material]
  if (materialInfo.priceDelta > 0) {
    breakdown.push({ label: `Material: ${materialInfo.label}`, amount: materialInfo.priceDelta })
  }

  // 4. Strap
  const strapInfo = STRAP_INFO[config.strap]
  if (strapInfo.priceDelta > 0) {
    breakdown.push({ label: `Strap: ${strapInfo.label}`, amount: strapInfo.priceDelta })
  }

  // 5. Logo / Personalization
  if (config.hasLogo) {
    breakdown.push({ label: 'Personalized Logo / Text', amount: 100 })
  }

  // 6. Extra Features
  config.extraFeatures.forEach((feat) => {
    const featInfo = EXTRA_FEATURES_INFO[feat]
    if (featInfo) {
      breakdown.push({ label: featInfo.label, amount: featInfo.priceDelta })
    }
  })

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)

  return {
    total,
    basePrice,
    breakdown,
  }
}
