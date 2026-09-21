import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const BrandsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Brands"
        description="Manage bag brands and manufacturers."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Products', href: '/products' }, { label: 'Brands' }]}
      />
      <PlaceholderCard
        featureName="Brand Management"
        endpoints={[
          'GET /api/v1/brands?status={status}',
          'POST /api/v1/brands',
          'GET /api/v1/brands/{id}',
          'PUT /api/v1/brands/{id}',
          'PATCH /api/v1/brands/{id}/status',
        ]}
      />
    </div>
  )
}
