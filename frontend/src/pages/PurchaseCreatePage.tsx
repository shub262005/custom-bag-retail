import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const PurchaseCreatePage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Create Purchase Order"
        description="Enter supplier invoice details, line items, and optional initial payment."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Purchases', href: '/purchases' },
          { label: 'New Purchase' },
        ]}
      />
      <PlaceholderCard
        featureName="New Purchase Invoice Entry"
        endpoints={['POST /api/v1/purchases']}
      />
    </div>
  )
}
