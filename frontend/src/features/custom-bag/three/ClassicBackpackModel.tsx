import { RoundedBox } from '@react-three/drei'
import { BAG_COLOR_PALETTE, BAG_SIZE_SCALE, type BagConfiguration } from './bagConfiguration'
import {
  BagBranding,
  CurvedDetail,
  type BrandingCoordinates,
} from './BagModelShared'
import { MATERIAL_APPEARANCE } from './bagModelMaterials'

const COLORS = {
  trim: '#91a1b5',
  hardware: '#b8c2cf',
}

interface ClassicBackpackModelProps {
  configuration: BagConfiguration
}

export function ClassicBackpackModel({ configuration }: ClassicBackpackModelProps) {
  const bodyColor = BAG_COLOR_PALETTE[configuration.bodyColor].hex
  const pocketColor = BAG_COLOR_PALETTE[configuration.pocketColor].hex
  const strapColor = BAG_COLOR_PALETTE[configuration.strapColor].hex
  const materialAppearance = MATERIAL_APPEARANCE[configuration.material]
  const bodySurfaceZ = 0.785
  const brandingPositions: BrandingCoordinates = {
    UPPER_FRONT: [0, 0.88, bodySurfaceZ],
    CENTER: [0, 0.08, bodySurfaceZ],
    FRONT_POCKET: [0, -1.08, configuration.frontPocket ? 1.215 : bodySurfaceZ],
  }

  return (
    <group
      rotation={[0, -0.18, 0]}
      position={[0, 0.15, 0]}
      scale={BAG_SIZE_SCALE[configuration.size]}
    >
      <CurvedDetail
        points={[
          [-0.95, 1.75, -0.68],
          [-1.42, 0.85, -1.18],
          [-1.4, -0.65, -1.25],
          [-1.05, -1.8, -0.72],
        ]}
        radius={0.17}
        color={strapColor}
        finish={materialAppearance}
      />
      <CurvedDetail
        points={[
          [0.95, 1.75, -0.68],
          [1.42, 0.85, -1.18],
          [1.4, -0.65, -1.25],
          [1.05, -1.8, -0.72],
        ]}
        radius={0.17}
        color={strapColor}
        finish={materialAppearance}
      />

      <RoundedBox
        args={[2.98, 3.85, 1.52]}
        radius={0.38}
        smoothness={3}
        position={[0, -0.25, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={bodyColor} {...materialAppearance} />
      </RoundedBox>
      <RoundedBox
        args={[2.92, 1.75, 1.5]}
        radius={0.48}
        smoothness={3}
        position={[0, 1.38, -0.01]}
        castShadow
      >
        <meshStandardMaterial color={bodyColor} {...materialAppearance} />
      </RoundedBox>

      {configuration.frontPocket && (
        <>
          <RoundedBox
            args={[2.35, 1.55, 0.52]}
            radius={0.3}
            smoothness={2}
            position={[0, -1.04, 0.94]}
            castShadow
          >
            <meshStandardMaterial color={pocketColor} {...materialAppearance} />
          </RoundedBox>
          <mesh position={[0, -0.58, 1.2]} castShadow>
            <boxGeometry args={[1.86, 0.06, 0.06]} />
            <meshStandardMaterial color={COLORS.trim} roughness={0.52} metalness={0.15} />
          </mesh>
          <mesh position={[0.88, -0.58, 1.23]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.07]} />
            <meshStandardMaterial color={COLORS.hardware} roughness={0.4} metalness={0.35} />
          </mesh>
        </>
      )}

      {configuration.sidePockets && (
        <>
          <RoundedBox
            args={[0.48, 1.32, 1.12]}
            radius={0.22}
            smoothness={2}
            position={[-1.58, -0.9, 0.06]}
            castShadow
          >
            <meshStandardMaterial color={pocketColor} {...materialAppearance} />
          </RoundedBox>
          <RoundedBox
            args={[0.48, 1.32, 1.12]}
            radius={0.22}
            smoothness={2}
            position={[1.58, -0.9, 0.06]}
            castShadow
          >
            <meshStandardMaterial color={pocketColor} {...materialAppearance} />
          </RoundedBox>
        </>
      )}

      <CurvedDetail
        points={[
          [-0.65, 2.18, -0.12],
          [-0.55, 2.72, -0.18],
          [0, 2.88, -0.2],
          [0.55, 2.72, -0.18],
          [0.65, 2.18, -0.12],
        ]}
        radius={0.13}
        color={strapColor}
        finish={materialAppearance}
        tubularSegments={10}
      />

      <BagBranding configuration={configuration} positions={brandingPositions} />
    </group>
  )
}
