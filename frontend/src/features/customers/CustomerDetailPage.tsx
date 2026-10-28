import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton, SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatINR, formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import { useCustomer, useCustomerSales, useCustomerRepayments } from './useCustomers'
import { CustomerFormModal } from './CustomerFormModal'
import { RecordRepaymentModal } from './RecordRepaymentModal'
import {
  ArrowLeft,
  CreditCard,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Receipt,
  History,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)

  const [activeTab, setActiveTab] = useState<'sales' | 'repayments'>('sales')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false)

  const {
    data: customer,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    error: customerError,
    refetch: refetchCustomer,
  } = useCustomer(customerId)

  const {
    data: sales = [],
    isLoading: isSalesLoading,
    refetch: refetchSales,
  } = useCustomerSales(customerId)

  const {
    data: repayments = [],
    isLoading: isRepaymentsLoading,
    refetch: refetchRepayments,
  } = useCustomerRepayments(customerId)

  const refetchAll = () => {
    void refetchCustomer()
    void refetchSales()
    void refetchRepayments()
  }

  if (isCustomerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    )
  }

  if (isCustomerError || !customer) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <ErrorAlert
          title="Customer Not Found"
          message={customerError ? getErrorMessage(customerError) : 'The requested customer does not exist.'}
          onRetry={refetchAll}
        />
      </div>
    )
  }

  const hasDue = (customer.totalDueAmount || 0) > 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={customer.name}
        description={`Customer ledger profile • Phone: ${customer.phone}`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: customer.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link to="/customers">
              <Button size="sm" variant="secondary" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Details
            </Button>
            {hasDue && (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => setIsRepaymentModalOpen(true)}
              >
                Record Repayment
              </Button>
            )}
          </div>
        }
      />

      {/* Customer Info Card & Balance Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="lg:col-span-1 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Customer Details</CardTitle>
              <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {customer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-900">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600">{customer.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>Customer since {formatDate(customer.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Overview Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-2xs p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Billed</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(customer.totalPurchasesAmount)}</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              {customer.totalPurchasesCount || 0} total order(s)
            </p>
          </Card>

          <Card className="shadow-2xs p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Repaid Later</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatINR(customer.totalRepaidAmount || 0)}</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              {repayments.length} repayment record(s)
            </p>
          </Card>

          <Card
            className={`shadow-2xs p-4 flex flex-col justify-between border-l-4 ${
              hasDue ? 'border-l-red-500 bg-red-50/20' : 'border-l-slate-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
              <p className={`text-xl font-bold mt-1 ${hasDue ? 'text-red-600' : 'text-slate-700'}`}>
                {formatINR(customer.totalDueAmount || 0)}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <AlertCircle className={`w-3.5 h-3.5 ${hasDue ? 'text-red-500' : 'text-slate-400'}`} />
              {hasDue ? 'Payment pending' : 'Zero balance due'}
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Customer Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`py-2.5 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales & Orders ({sales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('repayments')}
            className={`py-2.5 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'repayments'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Repayment History ({repayments.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Sales & Orders */}
      {activeTab === 'sales' && (
        <div>
          {isSalesLoading ? (
            <SkeletonTable rows={4} cols={7} />
          ) : sales.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-6 h-6 text-slate-400" />}
              title="No sales found for this customer."
              description="Sales made with this customer's account will appear here."
              action={
                <Link to="/sales/pos">
                  <Button size="sm" variant="primary">
                    Create New Sale
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Remaining Due</TableHead>
                    <TableHead className="text-center">Payment Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const due = sale.dueAmount || 0

                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium text-blue-600">
                          <Link to={`/sales/${sale.id}`} className="hover:underline">
                            {sale.saleNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(sale.saleDate)}</TableCell>
                        <TableCell className="text-center text-xs text-slate-600">
                          {sale.items?.length || 0}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatINR(sale.grandTotal)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 font-medium">
                          {formatINR(sale.paidAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {due > 0 ? (
                            <span className="font-bold text-red-600">{formatINR(due)}</span>
                          ) : (
                            <span className="text-xs text-slate-400">₹0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {sale.paymentStatus === 'PAID' ? (
                            <Badge variant="success">Paid</Badge>
                          ) : sale.paymentStatus === 'PARTIALLY_PAID' ? (
                            <Badge variant="warning">Partially Paid</Badge>
                          ) : (
                            <Badge variant="danger">Unpaid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/sales/${sale.id}`} className="text-xs text-blue-600 hover:underline">
                            View Sale
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Repayment History */}
      {activeTab === 'repayments' && (
        <div>
          {isRepaymentsLoading ? (
            <SkeletonTable rows={4} cols={6} />
          ) : repayments.length === 0 ? (
            <EmptyState
              icon={<History className="w-6 h-6 text-slate-400" />}
              title="No repayments recorded yet."
              description="When the customer makes partial or full repayments towards their due balance, entries will appear here."
              action={
                hasDue ? (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                    onClick={() => setIsRepaymentModalOpen(true)}
                  >
                    Record Repayment
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount Repaid</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Sale Reference</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repayments.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium text-slate-800">{formatDate(rep.repaymentDate)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatINR(rep.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{rep.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {rep.saleNumber ? (
                          <Link to={`/sales/${rep.saleId}`} className="text-blue-600 hover:underline">
                            {rep.saleNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-400">General Balance</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{rep.receivedBy || 'Staff'}</TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {rep.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customer}
        onSuccess={() => refetchAll()}
      />

      {/* Record Repayment Modal */}
      <RecordRepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        customerPhone={customer.phone}
        maxDueAmount={customer.totalDueAmount || 0}
        onSuccess={() => refetchAll()}
      />
    </div>
  )
}
