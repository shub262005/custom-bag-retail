import type {
  BagConfiguration,
  BagType,
  BrandingPosition,
  CompartmentCount,
} from './bagConfiguration'

export interface BagTemplateDefinition {
  id: BagType
  label: string
  shortLabel: string
  basePrice: number
  supportsFrontPocket: boolean
  supportsSidePockets: boolean
  supportsLaptopPadding: boolean
  supportedCompartments: readonly CompartmentCount[]
  supportedBrandingPositions: readonly BrandingPosition[]
  defaults: Pick<
    BagConfiguration,
    'frontPocket' | 'sidePockets' | 'laptopPadding' | 'compartmentCount'
  >
}

const ALL_BRANDING_POSITIONS: readonly BrandingPosition[] = [
  'UPPER_FRONT',
  'CENTER',
  'FRONT_POCKET',
]

export const BAG_TEMPLATES: Record<BagType, BagTemplateDefinition> = {
  BACKPACK: {
    id: 'BACKPACK',
    label: 'Classic Backpack',
    shortLabel: 'Backpack',
    basePrice: 1200,
    supportsFrontPocket: true,
    supportsSidePockets: true,
    supportsLaptopPadding: true,
    supportedCompartments: [1, 2, 3, 4],
    supportedBrandingPositions: ALL_BRANDING_POSITIONS,
    defaults: { frontPocket: true, sidePockets: true, laptopPadding: false, compartmentCount: 2 },
  },
  LAPTOP_BAG: {
    id: 'LAPTOP_BAG',
    label: 'Laptop Bag',
    shortLabel: 'Laptop',
    basePrice: 1400,
    supportsFrontPocket: true,
    supportsSidePockets: false,
    supportsLaptopPadding: true,
    supportedCompartments: [1, 2, 3],
    supportedBrandingPositions: ALL_BRANDING_POSITIONS,
    defaults: { frontPocket: true, sidePockets: false, laptopPadding: true, compartmentCount: 2 },
  },
  DUFFEL_BAG: {
    id: 'DUFFEL_BAG',
    label: 'Duffel Bag',
    shortLabel: 'Duffel',
    basePrice: 1600,
    supportsFrontPocket: true,
    supportsSidePockets: true,
    supportsLaptopPadding: false,
    supportedCompartments: [1, 2, 3, 4],
    supportedBrandingPositions: ALL_BRANDING_POSITIONS,
    defaults: { frontPocket: true, sidePockets: true, laptopPadding: false, compartmentCount: 2 },
  },
}

export function normalizeConfigurationForTemplate(
  configuration: BagConfiguration,
  bagType: BagType,
): BagConfiguration {
  const template = BAG_TEMPLATES[bagType]
  const compartmentCount = template.supportedCompartments.includes(
    configuration.compartmentCount,
  )
    ? configuration.compartmentCount
    : template.defaults.compartmentCount

  return {
    ...configuration,
    bagType,
    frontPocket: template.supportsFrontPocket ? configuration.frontPocket : false,
    sidePockets: template.supportsSidePockets ? configuration.sidePockets : false,
    laptopPadding: template.supportsLaptopPadding ? configuration.laptopPadding : false,
    compartmentCount,
    logoPosition: template.supportedBrandingPositions.includes(configuration.logoPosition)
      ? configuration.logoPosition
      : 'UPPER_FRONT',
    textPosition: template.supportedBrandingPositions.includes(configuration.textPosition)
      ? configuration.textPosition
      : 'CENTER',
  }
}
