import { RoundedBox } from '@react-three/drei'
import { BAG_COLOR_PALETTE, BAG_SIZE_SCALE, type BagConfiguration } from './bagConfiguration'
import { BagBranding, CurvedDetail, type BrandingCoordinates } from './BagModelShared'
import { MATERIAL_APPEARANCE } from './bagModelMaterials'

export function SlingBagModel({ configuration }: { configuration: BagConfiguration }) {
  const body = BAG_COLOR_PALETTE[configuration.bodyColor].hex
  const pocket = BAG_COLOR_PALETTE[configuration.pocketColor].hex
  const strap = BAG_COLOR_PALETTE[configuration.strapColor].hex
  const finish = MATERIAL_APPEARANCE[configuration.material]
  const positions: BrandingCoordinates = {
    UPPER_FRONT: [0, 0.64, 0.63], CENTER: [0, 0.1, 0.63],
    FRONT_POCKET: [0, -0.62, configuration.frontPocket ? 0.87 : 0.61],
  }
  return <group position={[0, -0.25, 0]} rotation={[0, -0.18, -0.08]} scale={BAG_SIZE_SCALE[configuration.size]}>
    <CurvedDetail points={[[-0.9, -1.45, -0.34], [-1.9, -0.15, -0.8], [-1.5, 2.45, -0.9], [0.7, 2.65, -0.5], [0.95, 1.32, -0.3]]} radius={0.14} color={strap} finish={finish} tubularSegments={32} />
    <RoundedBox args={[2.45, 3.05, 1.18]} radius={0.5} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color={body} {...finish} />
    </RoundedBox>
    {Array.from({ length: configuration.compartmentCount }, (_, i) => <mesh key={i} position={[0, 1.3 - i * 0.22, 0.6]} rotation={[0, 0, 0.12]}>
      <boxGeometry args={[1.65, 0.045, 0.03]} /><meshStandardMaterial color="#b9a681" metalness={0.5} roughness={0.45} />
    </mesh>)}
    {configuration.frontPocket && <group>
      <RoundedBox args={[1.92, 1.13, 0.45]} position={[0, -0.62, 0.62]} radius={0.23} smoothness={3} castShadow>
        <meshStandardMaterial color={pocket} {...finish} />
      </RoundedBox>
      <mesh position={[0, -0.15, 0.86]} rotation={[0, 0, 0.1]}><boxGeometry args={[1.45, 0.045, 0.025]} /><meshStandardMaterial color={strap} {...finish} /></mesh>
    </group>}
    <RoundedBox args={[0.34, 0.7, 0.19]} position={[-0.96, -1.12, -0.42]} radius={0.06} smoothness={2} castShadow><meshStandardMaterial color={strap} {...finish} /></RoundedBox>
    <mesh position={[-1.42, 0.25, -0.68]} rotation={[0, 0, -0.3]} castShadow><boxGeometry args={[0.35, 0.36, 0.2]} /><meshStandardMaterial color="#8c806d" metalness={0.65} roughness={0.4} /></mesh>
    <BagBranding configuration={configuration} positions={positions} />
  </group>
}
