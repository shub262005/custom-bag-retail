import React from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { CustomBagDesigner } from './three/CustomBagDesigner'
import { useAuth } from '../../hooks/useAuth'

export const CustomBagPage: React.FC = () => {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Bag"
        description="Choose a backpack, laptop bag, duffel, tote or sling and make it yours in 3D."
        breadcrumbs={user?.role === 'CUSTOMER'
          ? [{ label: 'Custom Bag' }]
          : [{ label: 'Home', href: '/dashboard' }, { label: 'Custom Bag' }]}
      />

      <CustomBagDesigner />
    </div>
  )
}
