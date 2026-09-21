import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'

export const ReportsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Reports Center"
        description="Daily sales summaries, date-range breakdowns, product performance, and cancellation audits."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
      />
      <PlaceholderCard
        featureName="Sales & Financial Reporting"
        endpoints={[
          'GET /api/v1/sales/reports/daily?date=YYYY-MM-DD',
          'GET /api/v1/sales/reports/date-range?startDate=...&endDate=...',
          'GET /api/v1/sales/reports/by-product?startDate=...&endDate=...',
          'GET /api/v1/sales/reports/by-category?startDate=...&endDate=...',
          'GET /api/v1/sales/reports/by-payment-method?startDate=...&endDate=...',
          'GET /api/v1/sales/reports/cancelled?startDate=...&endDate=...',
        ]}
      />
    </div>
  )
}
