import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Store operational metrics, daily sales summary, and inventory health."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
      />
      <PlaceholderCard
        featureName="Store Dashboard"
        endpoints={[
          'GET /api/v1/sales/dashboard?date=YYYY-MM-DD',
          'GET /api/v1/products?status=ACTIVE (for low-stock calculations)',
        ]}
      />
    </div>
  )
}
