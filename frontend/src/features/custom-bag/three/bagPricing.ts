import type {
  BagConfiguration,
  BagMaterial,
  BagSize,
  CompartmentCount,
} from './bagConfiguration'
import { BAG_TEMPLATES } from './bagTemplates'

export const BAG_PRICING = {
  size: {
    SMALL: 0,
    MEDIUM: 150,
    LARGE: 300,
  } satisfies Record<BagSize, number>,
  material: {
    POLYESTER: 0,
    CANVAS: 150,
    LEATHER: 500,
  } satisfies Record<BagMaterial, number>,
  compartments: {
    1: 0,
    2: 100,
    3: 200,
    4: 300,
  } satisfies Record<CompartmentCount, number>,
  features: {
    frontPocket: 100,
    sidePockets: 150,
    laptopPadding: 200,
    waterResistant: 150,
  },
  branding: {
    logoPrinting: 200,
    customText: 100,
  },
} as const

export interface BagPriceAdjustment {
  label: string
  amount: number
}

export interface BagPriceResult {
  basePrice: number
  adjustments: BagPriceAdjustment[]
  total: number
}

const SIZE_LABELS: Record<BagSize, string> = {
  SMALL: 'Small Size',
  MEDIUM: 'Medium Size',
  LARGE: 'Large Size',
}

const MATERIAL_LABELS: Record<BagMaterial, string> = {
  POLYESTER: 'Polyester Material',
  CANVAS: 'Canvas Material',
  LEATHER: 'Leather Material',
}

export function calculateBagPrice(configuration: BagConfiguration): BagPriceResult {
  const template = BAG_TEMPLATES[configuration.bagType]
  const candidates: BagPriceAdjustment[] = [
    { label: SIZE_LABELS[configuration.size], amount: BAG_PRICING.size[configuration.size] },
    {
      label: MATERIAL_LABELS[configuration.material],
      amount: BAG_PRICING.material[configuration.material],
    },
    {
      label: `${configuration.compartmentCount} ${
        configuration.compartmentCount === 1 ? 'Compartment' : 'Compartments'
      }`,
      amount: template.supportedCompartments.includes(configuration.compartmentCount)
        ? BAG_PRICING.compartments[configuration.compartmentCount]
        : 0,
    },
    {
      label: 'Front Pocket',
      amount:
        template.supportsFrontPocket && configuration.frontPocket
          ? BAG_PRICING.features.frontPocket
          : 0,
    },
    {
      label: 'Side Pockets',
      amount:
        template.supportsSidePockets && configuration.sidePockets
          ? BAG_PRICING.features.sidePockets
          : 0,
    },
    {
      label: 'Laptop Padding',
      amount:
        template.supportsLaptopPadding && configuration.laptopPadding
          ? BAG_PRICING.features.laptopPadding
          : 0,
    },
    {
      label: 'Water Resistant',
      amount: configuration.waterResistant ? BAG_PRICING.features.waterResistant : 0,
    },
    {
      label: 'Logo Printing',
      amount: configuration.logoImage ? BAG_PRICING.branding.logoPrinting : 0,
    },
    {
      label: 'Custom Text',
      amount: configuration.customText.trim() ? BAG_PRICING.branding.customText : 0,
    },
  ]

  const adjustments = candidates.filter((entry) => entry.amount > 0)
  const total = adjustments.reduce<number>(
    (sum, entry) => sum + entry.amount,
    template.basePrice,
  )

  return {
    basePrice: template.basePrice,
    adjustments,
    total,
  }
}
