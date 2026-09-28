import { RoundedBox } from '@react-three/drei'
import { BAG_COLOR_PALETTE, BAG_SIZE_SCALE, type BagConfiguration } from './bagConfiguration'
import {
  BagBranding,
  CurvedDetail,
  type BrandingCoordinates,
} from './BagModelShared'
import { MATERIAL_APPEARANCE } from './bagModelMaterials'

interface LaptopBagModelProps {
  configuration: BagConfiguration
}

export function LaptopBagModel({ configuration }: LaptopBagModelProps) {
  const bodyColor = BAG_COLOR_PALETTE[configuration.bodyColor].hex
  const pocketColor = BAG_COLOR_PALETTE[configuration.pocketColor].hex
  const strapColor = BAG_COLOR_PALETTE[configuration.strapColor].hex
  const materialAppearance = MATERIAL_APPEARANCE[configuration.material]
  const bodySurfaceZ = 0.445
  const brandingPositions: BrandingCoordinates = {
    UPPER_FRONT: [0, 0.72, bodySurfaceZ],
    CENTER: [0, 0.05, bodySurfaceZ],
    FRONT_POCKET: [0, -0.62, configuration.frontPocket ? 0.695 : bodySurfaceZ],
  }

  return (
    <group
      rotation={[0, -0.16, 0]}
      position={[0, -0.55, 0]}
      scale={BAG_SIZE_SCALE[configuration.size] * 0.9}
    >
      <RoundedBox
        args={[4.75, 2.95, 0.84]}
        radius={0.34}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={bodyColor} {...materialAppearance} />
      </RoundedBox>

      {configuration.frontPocket && (
        <RoundedBox
          args={[3.55, 1.18, 0.48]}
          radius={0.22}
          smoothness={2}
          position={[0, -0.62, 0.48]}
          castShadow
        >
          <meshStandardMaterial color={pocketColor} {...materialAppearance} />
        </RoundedBox>
      )}

      <mesh position={[0, 1.08, 0.44]} castShadow>
        <boxGeometry args={[3.75, 0.055, 0.055]} />
        <meshStandardMaterial color="#93a3b6" roughness={0.5} metalness={0.16} />
      </mesh>

      <CurvedDetail
        points={[
          [-1.05, 1.3, 0.26],
          [-0.88, 1.92, 0.28],
          [0, 2.08, 0.3],
          [0.88, 1.92, 0.28],
          [1.05, 1.3, 0.26],
        ]}
        radius={0.12}
        color={strapColor}
        finish={materialAppearance}
      />
      <CurvedDetail
        points={[
          [-1.05, 1.3, -0.28],
          [-0.88, 1.88, -0.32],
          [0, 2.02, -0.34],
          [0.88, 1.88, -0.32],
          [1.05, 1.3, -0.28],
        ]}
        radius={0.1}
        color={strapColor}
        finish={materialAppearance}
      />
      <CurvedDetail
        points={[
          [-2.18, 0.95, -0.18],
          [-2.72, 0.05, -0.78],
          [-1.35, -1.75, -0.92],
          [1.35, -1.75, -0.92],
          [2.72, 0.05, -0.78],
          [2.18, 0.95, -0.18],
        ]}
        radius={0.095}
        color={strapColor}
        finish={materialAppearance}
        tubularSegments={18}
      />

      <BagBranding configuration={configuration} positions={brandingPositions} />
    </group>
  )
}
