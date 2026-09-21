import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Plus } from 'lucide-react'

export const SalesPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Sales History"
        description="Historical ledger of completed and cancelled retail sales transactions."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales' }]}
        actions={
          <Link to="/sales/pos">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Open POS Register
            </Button>
          </Link>
        }
      />
      <PlaceholderCard
        featureName="Sales History Ledger"
        endpoints={[
          'GET /api/v1/sales?saleNumber=&status=&startDate=&endDate=&paymentMethod=&search=',
          'GET /api/v1/sales/{id}',
          'GET /api/v1/sales/number/{saleNumber}',
          'PUT /api/v1/sales/{id}',
          'PATCH /api/v1/sales/{id}/cancel',
          'GET /api/v1/sales/{id}/inventory-transactions',
          'GET /api/v1/sales/{id}/audit-history',
        ]}
      />
    </div>
  )
}
