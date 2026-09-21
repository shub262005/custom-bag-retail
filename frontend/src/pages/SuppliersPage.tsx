import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const SuppliersPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendor directory, phone contacts, email channels, and GST records."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Suppliers' }]}
      />
      <PlaceholderCard
        featureName="Supplier Management"
        endpoints={[
          'GET /api/v1/suppliers?status={status}',
          'GET /api/v1/suppliers/search?q={query}',
          'POST /api/v1/suppliers',
          'GET /api/v1/suppliers/{id}',
          'PUT /api/v1/suppliers/{id}',
          'PATCH /api/v1/suppliers/{id}/status',
        ]}
      />
    </div>
  )
}
