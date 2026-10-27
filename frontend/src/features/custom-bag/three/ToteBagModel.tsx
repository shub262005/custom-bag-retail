import { RoundedBox } from '@react-three/drei'
import { BAG_COLOR_PALETTE, BAG_SIZE_SCALE, type BagConfiguration } from './bagConfiguration'
import { BagBranding, CurvedDetail, type BrandingCoordinates } from './BagModelShared'
import { MATERIAL_APPEARANCE } from './bagModelMaterials'

export function ToteBagModel({ configuration }: { configuration: BagConfiguration }) {
  const body = BAG_COLOR_PALETTE[configuration.bodyColor].hex
  const pocket = BAG_COLOR_PALETTE[configuration.pocketColor].hex
  const strap = BAG_COLOR_PALETTE[configuration.strapColor].hex
  const finish = MATERIAL_APPEARANCE[configuration.material]
  const positions: BrandingCoordinates = {
    UPPER_FRONT: [0, 1.02, 0.59], CENTER: [0, 0.18, 0.59],
    FRONT_POCKET: [0, -0.62, configuration.frontPocket ? 0.81 : 0.59],
  }
  return <group position={[0, -0.45, 0]} rotation={[0, -0.16, 0]} scale={BAG_SIZE_SCALE[configuration.size]}>
    <RoundedBox args={[3.3, 3.2, 1.15]} radius={0.22} smoothness={3} castShadow receiveShadow>
      <meshStandardMaterial color={body} {...finish} />
    </RoundedBox>
    <RoundedBox args={[3.32, 0.3, 1.17]} position={[0, -1.43, 0]} radius={0.1} smoothness={2} castShadow>
      <meshStandardMaterial color={strap} {...finish} />
    </RoundedBox>
    <RoundedBox args={[3.15, 0.12, 1.02]} position={[0, 1.58, 0]} radius={0.045} smoothness={2}>
      <meshStandardMaterial color={strap} {...finish} />
    </RoundedBox>
    {Array.from({ length: configuration.compartmentCount }, (_, i) => <mesh key={i} position={[0, 1.65, configuration.compartmentCount === 1 ? 0 : (i - 0.5) * 0.45]}>
      <boxGeometry args={[2.8, 0.025, 0.035]} /><meshStandardMaterial color="#b9a681" metalness={0.5} roughness={0.45} />
    </mesh>)}
    {configuration.frontPocket && <group>
      <RoundedBox args={[2.1, 1.25, 0.36]} position={[0, -0.62, 0.61]} radius={0.12} smoothness={2} castShadow>
        <meshStandardMaterial color={pocket} {...finish} />
      </RoundedBox>
      <mesh position={[0, -0.04, 0.8]}><boxGeometry args={[1.85, 0.04, 0.025]} /><meshStandardMaterial color={strap} {...finish} /></mesh>
    </group>}
    {([-0.46, 0.46] as const).map(z => <group key={z}>
      {[-1, 1].map(x => <RoundedBox key={x} args={[0.18, 1.15, 0.1]} position={[x, 1.02, z > 0 ? 0.59 : -0.59]} radius={0.04} smoothness={2} castShadow><meshStandardMaterial color={strap} {...finish} /></RoundedBox>)}
      <CurvedDetail points={[[-1, 1.48, z], [-0.9, 2.4, z], [0, 2.67, z], [0.9, 2.4, z], [1, 1.48, z]]} radius={0.1} color={strap} finish={finish} tubularSegments={24} />
    </group>)}
    <BagBranding configuration={configuration} positions={positions} />
  </group>
}
