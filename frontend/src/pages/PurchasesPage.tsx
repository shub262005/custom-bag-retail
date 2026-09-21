import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PlaceholderCard } from '../components/common/PlaceholderCard'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Plus } from 'lucide-react'

export const PurchasesPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Purchase orders, inbound supplier stock receipts, and payment records."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Purchases' }]}
        actions={
          <Link to="/purchases/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Purchase
            </Button>
          </Link>
        }
      />
      <PlaceholderCard
        featureName="Purchase Management"
        endpoints={[
          'GET /api/v1/purchases?supplierId=&status=&startDate=&endDate=&search=',
          'GET /api/v1/purchases/{id}',
          'GET /api/v1/purchases/number/{purchaseNumber}',
          'PUT /api/v1/purchases/{id}',
          'PATCH /api/v1/purchases/{id}/cancel',
          'POST /api/v1/purchases/{id}/payments',
          'PUT /api/v1/purchases/{id}/payments/{paymentId}',
          'DELETE /api/v1/purchases/{id}/payments/{paymentId}',
        ]}
      />
    </div>
  )
}
