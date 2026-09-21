import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const PosPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="POS Cashier Terminal"
        description="High-speed barcode scanner checkout, inline price adjustment, and immediate receipt generation."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales' }, { label: 'POS Terminal' }]}
      />
      <PlaceholderCard
        featureName="Retail POS Register"
        endpoints={['POST /api/v1/sales', 'GET /api/v1/products/search?q=...']}
      />
    </div>
  )
}
