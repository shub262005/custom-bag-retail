import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const ProductsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage bag catalog, prices, and stock indicators."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Products' }, { label: 'All Products' }]}
      />
      <PlaceholderCard
        featureName="Product Management"
        endpoints={[
          'GET /api/v1/products?status={status}',
          'GET /api/v1/products/search?q={query}',
          'POST /api/v1/products',
          'GET /api/v1/products/{id}',
          'PUT /api/v1/products/{id}',
          'PATCH /api/v1/products/{id}/status',
        ]}
      />
    </div>
  )
}
