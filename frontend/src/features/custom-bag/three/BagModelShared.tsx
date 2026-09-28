import { useEffect, useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  BRAND_TEXT_COLORS,
  type BagConfiguration,
  type BrandingPosition,
} from './bagConfiguration'
import type { MaterialAppearance } from './bagModelMaterials'

export type BrandingCoordinates = Record<BrandingPosition, [number, number, number]>

interface CurvedDetailProps {
  points: [number, number, number][]
  radius: number
  color: string
  tubularSegments?: number
  radialSegments?: number
  finish: MaterialAppearance
}

export function CurvedDetail({
  points,
  radius,
  color,
  finish,
  tubularSegments = 12,
  radialSegments = 6,
}: CurvedDetailProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  )

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, tubularSegments, radius, radialSegments, false]} />
      <meshStandardMaterial color={color} {...finish} />
    </mesh>
  )
}

function LogoPlane({ source, position }: { source: string; position: [number, number, number] }) {
  const texture = useMemo(() => {
    const loadedTexture = new THREE.TextureLoader().load(source)
    loadedTexture.colorSpace = THREE.SRGBColorSpace
    return loadedTexture
  }, [source])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={position} renderOrder={2}>
      <planeGeometry args={[1.12, 0.66]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.02}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        toneMapped={false}
      />
    </mesh>
  )
}

interface BagBrandingProps {
  configuration: BagConfiguration
  positions: BrandingCoordinates
}

export function BagBranding({ configuration, positions }: BagBrandingProps) {
  const cleanCustomText = configuration.customText.trim()
  const brandingOverlap = Boolean(
    configuration.logoImage &&
      cleanCustomText &&
      configuration.logoPosition === configuration.textPosition,
  )
  const logoPosition = [...positions[configuration.logoPosition]] as [number, number, number]
  const textPosition = [...positions[configuration.textPosition]] as [number, number, number]

  textPosition[2] += 0.012
  if (brandingOverlap) {
    logoPosition[1] += 0.2
    textPosition[1] -= 0.24
  }

  return (
    <>
      {configuration.logoImage && (
        <LogoPlane source={configuration.logoImage} position={logoPosition} />
      )}
      {cleanCustomText && (
        <Text
          position={textPosition}
          color={BRAND_TEXT_COLORS[configuration.textColor].hex}
          fontSize={0.24}
          maxWidth={1.8}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          renderOrder={3}
          material-depthWrite={false}
        >
          {cleanCustomText}
        </Text>
      )}
    </>
  )
}
