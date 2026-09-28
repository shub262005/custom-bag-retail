import { RoundedBox } from '@react-three/drei'
import { BAG_COLOR_PALETTE, BAG_SIZE_SCALE, type BagConfiguration } from './bagConfiguration'
import {
  BagBranding,
  CurvedDetail,
  type BrandingCoordinates,
} from './BagModelShared'
import { MATERIAL_APPEARANCE } from './bagModelMaterials'

interface DuffelBagModelProps {
  configuration: BagConfiguration
}

export function DuffelBagModel({ configuration }: DuffelBagModelProps) {
  const bodyColor = BAG_COLOR_PALETTE[configuration.bodyColor].hex
  const pocketColor = BAG_COLOR_PALETTE[configuration.pocketColor].hex
  const strapColor = BAG_COLOR_PALETTE[configuration.strapColor].hex
  const materialAppearance = MATERIAL_APPEARANCE[configuration.material]
  const bodySurfaceZ = 1.025
  const brandingPositions: BrandingCoordinates = {
    UPPER_FRONT: [0, 0.48, bodySurfaceZ],
    CENTER: [0, -0.02, bodySurfaceZ],
    FRONT_POCKET: [0, -0.48, configuration.frontPocket ? 1.295 : bodySurfaceZ],
  }

  return (
    <group
      rotation={[0, -0.14, 0]}
      position={[0, -0.85, 0]}
      scale={BAG_SIZE_SCALE[configuration.size] * 0.8}
    >
      <RoundedBox
        args={[4.9, 2.2, 2]}
        radius={0.5}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={bodyColor} {...materialAppearance} />
      </RoundedBox>

      {configuration.frontPocket && (
        <RoundedBox
          args={[2.4, 1.05, 0.38]}
          radius={0.22}
          smoothness={2}
          position={[0, -0.48, 1.12]}
          castShadow
        >
          <meshStandardMaterial color={pocketColor} {...materialAppearance} />
        </RoundedBox>
      )}

      {configuration.sidePockets && (
        <>
          <RoundedBox
            args={[0.26, 1.42, 1.28]}
            radius={0.09}
            smoothness={4}
            position={[-2.47, -0.12, 0]}
            castShadow
          >
            <meshStandardMaterial color={pocketColor} {...materialAppearance} />
          </RoundedBox>
          <RoundedBox
            args={[0.26, 1.42, 1.28]}
            radius={0.09}
            smoothness={4}
            position={[2.47, -0.12, 0]}
            castShadow
          >
            <meshStandardMaterial color={pocketColor} {...materialAppearance} />
          </RoundedBox>
        </>
      )}

      <mesh position={[0, 1.08, 0.04]} castShadow>
        <boxGeometry args={[3.5, 0.055, 0.065]} />
        <meshStandardMaterial color="#93a3b6" roughness={0.5} metalness={0.16} />
      </mesh>

      <CurvedDetail
        points={[
          [-1.35, 0.75, 0.58],
          [-1.1, 1.75, 0.58],
          [0, 1.98, 0.58],
          [1.1, 1.75, 0.58],
          [1.35, 0.75, 0.58],
        ]}
        radius={0.12}
        color={strapColor}
        finish={materialAppearance}
        tubularSegments={16}
        radialSegments={8}
      />
      <CurvedDetail
        points={[
          [-1.35, 0.75, -0.58],
          [-1.1, 1.75, -0.58],
          [0, 1.98, -0.58],
          [1.1, 1.75, -0.58],
          [1.35, 0.75, -0.58],
        ]}
        radius={0.12}
        color={strapColor}
        finish={materialAppearance}
        tubularSegments={16}
        radialSegments={8}
      />

      <BagBranding configuration={configuration} positions={brandingPositions} />
    </group>
  )
}
