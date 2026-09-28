import React from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { CustomBagDesigner } from './three/CustomBagDesigner'

export const CustomBagPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Bag"
        description="Customize and inspect the Classic Backpack in the interactive 3D preview."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Custom Bag' }]}
      />

      <CustomBagDesigner />
    </div>
  )
}
