export type BagSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export type BagType = 'BACKPACK' | 'LAPTOP_BAG' | 'DUFFEL_BAG'

export type BagColor = 'BLACK' | 'NAVY' | 'BLUE' | 'RED' | 'GREEN' | 'GRAY' | 'BROWN'

export type BagMaterial = 'POLYESTER' | 'CANVAS' | 'LEATHER'

export type CompartmentCount = 1 | 2 | 3 | 4

export type BrandingPosition = 'UPPER_FRONT' | 'CENTER' | 'FRONT_POCKET'

export type BrandTextColor = 'WHITE' | 'BLACK' | 'RED' | 'BLUE' | 'YELLOW' | 'GRAY'

export interface BagConfiguration {
  bagType: BagType
  size: BagSize
  bodyColor: BagColor
  pocketColor: BagColor
  strapColor: BagColor
  frontPocket: boolean
  sidePockets: boolean
  material: BagMaterial
  compartmentCount: CompartmentCount
  laptopPadding: boolean
  waterResistant: boolean
  logoImage: string | null
  logoPosition: BrandingPosition
  customText: string
  textColor: BrandTextColor
  textPosition: BrandingPosition
}

export const BAG_COLOR_PALETTE: Record<BagColor, { label: string; hex: string }> = {
  BLACK: { label: 'Black', hex: '#171c24' },
  NAVY: { label: 'Navy', hex: '#243246' },
  BLUE: { label: 'Blue', hex: '#245a9b' },
  RED: { label: 'Red', hex: '#9f2f3d' },
  GREEN: { label: 'Green', hex: '#2f6951' },
  GRAY: { label: 'Gray', hex: '#596575' },
  BROWN: { label: 'Brown', hex: '#6e4937' },
}

export const BAG_SIZE_SCALE: Record<BagSize, number> = {
  SMALL: 0.88,
  MEDIUM: 1,
  LARGE: 1.12,
}

export const BRAND_TEXT_COLORS: Record<BrandTextColor, { label: string; hex: string }> = {
  WHITE: { label: 'White', hex: '#ffffff' },
  BLACK: { label: 'Black', hex: '#111827' },
  RED: { label: 'Red', hex: '#dc2626' },
  BLUE: { label: 'Blue', hex: '#2563eb' },
  YELLOW: { label: 'Yellow', hex: '#facc15' },
  GRAY: { label: 'Gray', hex: '#94a3b8' },
}

export const DEFAULT_BAG_CONFIGURATION: BagConfiguration = {
  bagType: 'BACKPACK',
  size: 'MEDIUM',
  bodyColor: 'NAVY',
  pocketColor: 'BLUE',
  strapColor: 'BLACK',
  frontPocket: true,
  sidePockets: true,
  material: 'POLYESTER',
  compartmentCount: 2,
  laptopPadding: false,
  waterResistant: false,
  logoImage: null,
  logoPosition: 'UPPER_FRONT',
  customText: '',
  textColor: 'WHITE',
  textPosition: 'CENTER',
}
