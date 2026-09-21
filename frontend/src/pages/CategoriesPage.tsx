import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const CategoriesPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize store inventory by bag categories."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Products', href: '/products' }, { label: 'Categories' }]}
      />
      <PlaceholderCard
        featureName="Category Management"
        endpoints={[
          'GET /api/v1/categories?status={status}',
          'POST /api/v1/categories',
          'GET /api/v1/categories/{id}',
          'PUT /api/v1/categories/{id}',
          'PATCH /api/v1/categories/{id}/status',
          'PATCH /api/v1/categories/{id}/activate',
          'PATCH /api/v1/categories/{id}/deactivate',
        ]}
      />
    </div>
  )
}
