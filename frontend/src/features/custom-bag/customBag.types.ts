export type BagType =
  | 'BACKPACK'
  | 'LAPTOP_BAG'
  | 'SLING_BAG'
  | 'TRAVEL_BAG'
  | 'TOTE_BAG'

export type BagSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export type BagColor =
  | 'BLACK'
  | 'NAVY_BLUE'
  | 'RED'
  | 'GREEN'
  | 'GREY'
  | 'BEIGE'

export type BagMaterial = 'CANVAS' | 'POLYESTER' | 'NYLON' | 'LEATHER'

export type BagCompartments = 1 | 2 | 3 | 4

export type BagStrap = 'STANDARD' | 'PADDED' | 'ADJUSTABLE'

export type ExtraFeature =
  | 'WATER_RESISTANT'
  | 'EXTRA_POCKET'
  | 'LAPTOP_PROTECTION'
  | 'BOTTLE_HOLDER'
  | 'CUSTOM_NAME_TAG'

export interface CustomBagConfig {
  bagType: BagType
  size: BagSize
  color: BagColor
  material: BagMaterial
  compartments: BagCompartments
  strap: BagStrap
  hasLogo: boolean
  logoText: string
  extraFeatures: ExtraFeature[]
  specialRequirements: string
}

export interface SavedCustomBagDesign {
  designCode: string
  config: CustomBagConfig
  estimatedPrice: number
  savedAt: string
}
