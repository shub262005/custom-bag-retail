import React from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Box } from 'lucide-react'
import { ClassicBackpackModel } from './ClassicBackpackModel'
import { DuffelBagModel } from './DuffelBagModel'
import { LaptopBagModel } from './LaptopBagModel'
import type { BagConfiguration } from './bagConfiguration'
import { BAG_TEMPLATES } from './bagTemplates'

type SceneErrorBoundaryState = { failed: boolean }

class SceneErrorBoundary extends React.Component<React.PropsWithChildren, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
          The 3D preview could not start on this device. WebGL may be unavailable.
        </div>
      )
    }

    return this.props.children
  }
}

interface BagPreview3DProps {
  configuration: BagConfiguration
}

function SelectedBagModel({ configuration }: BagPreview3DProps) {
  switch (configuration.bagType) {
    case 'LAPTOP_BAG':
      return <LaptopBagModel configuration={configuration} />
    case 'DUFFEL_BAG':
      return <DuffelBagModel configuration={configuration} />
    case 'BACKPACK':
    default:
      return <ClassicBackpackModel configuration={configuration} />
  }
}

function BackpackScene({ configuration }: BagPreview3DProps) {
  return (
    <>
      <color attach="background" args={['#eef2f7']} />
      <fog attach="fog" args={['#eef2f7', 11, 18]} />
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        intensity={2.6}
        position={[5, 7, 5]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight intensity={1.1} position={[-4, 2, 3]} color="#dbeafe" />
      <SelectedBagModel configuration={configuration} />
      <ContactShadows position={[0, -2.35, 0]} opacity={0.3} scale={8} blur={2.4} far={5} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.8}
        target={[0, 0.15, 0]}
      />
    </>
  )
}

export function BagPreview3D({ configuration }: BagPreview3DProps) {
  const template = BAG_TEMPLATES[configuration.bagType]

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Live preview
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-slate-900">{template.label}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {configuration.size.charAt(0) + configuration.size.slice(1).toLowerCase()} · Drag to rotate · Scroll to zoom
          </p>
        </div>
        <div className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 sm:block" aria-hidden="true">
          <Box className="h-5 w-5" />
        </div>
      </div>

      <div className="h-[420px] w-full sm:h-[500px]" aria-label="Interactive 3D model of a classic backpack">
        <SceneErrorBoundary>
          <Canvas
            camera={{ position: [6.4, 3.4, 7.2], fov: 38, near: 0.1, far: 50 }}
            dpr={[1, 1.75]}
            shadows
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <BackpackScene configuration={configuration} />
          </Canvas>
        </SceneErrorBoundary>
      </div>
    </section>
  )
}
