import type { BagMaterial } from './bagConfiguration'

export type MaterialAppearance = { roughness: number; metalness: number }

export const MATERIAL_APPEARANCE: Record<BagMaterial, MaterialAppearance> = {
  POLYESTER: { roughness: 0.76, metalness: 0.01 },
  CANVAS: { roughness: 0.96, metalness: 0 },
  LEATHER: { roughness: 0.48, metalness: 0.025 },
}
