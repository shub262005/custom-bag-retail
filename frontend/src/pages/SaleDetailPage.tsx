import React from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const SaleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <PageHeader
        title={`Sale Details: #${id || ''}`}
        description="Sale breakdown, items, payment information, inventory impact, and audit history."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: `Sale #${id}` },
        ]}
      />
      <PlaceholderCard
        featureName="Sale Detail View"
        endpoints={[
          `GET /api/v1/sales/${id}`,
          `GET /api/v1/sales/${id}/inventory-transactions`,
          `GET /api/v1/sales/${id}/audit-history`,
        ]}
      />
    </div>
  )
}
