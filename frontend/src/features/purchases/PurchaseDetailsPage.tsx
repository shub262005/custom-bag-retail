import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Ban,
  PlusCircle,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Package,
  Trash2,
  Clock,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { formatINR, formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../api/errorParser'
import {
  usePurchase,
  useCancelPurchase,
  useDeletePurchasePayment,
} from './usePurchases'
import { PurchasePaymentModal } from './PurchasePaymentModal'
import type { PurchasePaymentResponse } from '../../types'

export const PurchaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const purchaseId = Number(id)

  const { data: purchase, isLoading, isError, error, refetch } = usePurchase(purchaseId)
  const cancelPurchaseMutation = useCancelPurchase()
  const deletePaymentMutation = useDeletePurchasePayment()

  // Modal & Dialog state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentToEdit, setPaymentToEdit] = useState<PurchasePaymentResponse | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<PurchasePaymentResponse | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading Purchase Order..."
          description="Fetching purchase details from server"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Purchases', href: '/purchases' },
            { label: 'Loading...' },
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="h-40 animate-pulse bg-slate-100" />
          <Card className="h-40 animate-pulse bg-slate-100" />
          <Card className="h-40 animate-pulse bg-slate-100" />
        </div>
        <Card className="h-64 animate-pulse bg-slate-100" />
      </div>
    )
  }

  // Error state
  if (isError || !purchase) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Purchase Not Found"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Purchases', href: '/purchases' },
            { label: 'Error' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/purchases')}
            >
              Back to Purchases
            </Button>
          }
        />
        <ErrorAlert
          title="Could not load purchase details"
          message={getErrorMessage(error) || `Purchase with ID #${id} does not exist.`}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const isCancelled = purchase.status === 'CANCELLED'
  const isFullyPaid = purchase.paymentStatus === 'PAID'
  const totalUnits = purchase.items.reduce((sum, item) => sum + item.quantity, 0)

  // Handler: Cancel Purchase
  const handleConfirmCancel = async () => {
    setActionError(null)
    try {
      await cancelPurchaseMutation.mutateAsync(purchase.id)
      toast.success(`Purchase ${purchase.purchaseNumber} cancelled and inventory reversed.`)
      setIsCancelDialogOpen(false)
    } catch (err) {
      const msg = getErrorMessage(err)
      setActionError(msg)
      setIsCancelDialogOpen(false)
    }
  }

  // Handler: Open Add Payment
  const handleOpenAddPayment = () => {
    setPaymentToEdit(null)
    setIsPaymentModalOpen(true)
  }

  // Handler: Open Edit Payment
  const handleOpenEditPayment = (payment: PurchasePaymentResponse) => {
    setPaymentToEdit(payment)
    setIsPaymentModalOpen(true)
  }

  // Handler: Confirm Delete Payment
  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return
    setActionError(null)
    try {
      await deletePaymentMutation.mutateAsync({
        purchaseId: purchase.id,
        paymentId: paymentToDelete.id,
      })
      toast.success(`Payment of ${formatINR(paymentToDelete.amount)} removed.`)
      setPaymentToDelete(null)
    } catch (err) {
      const msg = getErrorMessage(err)
      setActionError(msg)
      setPaymentToDelete(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <PageHeader
        title={`Purchase: ${purchase.purchaseNumber}`}
        description={`Procurement from ${purchase.supplier?.name || 'Supplier'} recorded on ${formatDate(purchase.purchaseDate)}.`}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Purchases', href: '/purchases' },
          { label: purchase.purchaseNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/purchases')}
            >
              Back
            </Button>

            {!isCancelled && (
              <>
                <Link to={`/purchases/${purchase.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                  >
                    Edit Purchase
                  </Button>
                </Link>

                {!isFullyPaid && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                    onClick={handleOpenAddPayment}
                  >
                    Record Payment
                  </Button>
                )}

                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Ban className="w-3.5 h-3.5" />}
                  onClick={() => setIsCancelDialogOpen(true)}
                  isLoading={cancelPurchaseMutation.isPending}
                >
                  Cancel Purchase
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Action Error Alert */}
      {actionError && (
        <ErrorAlert
          title="Operation Failed"
          message={actionError}
        />
      )}

      {/* Top Key Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Vendor Information */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Vendor Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Supplier Name</span>
              <span className="font-semibold text-slate-900 text-sm">{purchase.supplier?.name || '—'}</span>
            </div>
            {purchase.supplier?.gstNumber && (
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">GST Number</span>
                <span className="font-mono text-slate-800">{purchase.supplier.gstNumber}</span>
              </div>
            )}
            {purchase.supplier?.address && (
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Address</span>
                <span className="text-slate-700">{purchase.supplier.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Invoice & Reference Information */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Invoice & Order Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Purchase Date:</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(purchase.purchaseDate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-mono font-medium text-slate-900">
                {purchase.invoiceNumber || '—'}
              </span>
            </div>
            {purchase.invoiceDate && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-medium text-slate-900">{formatDate(purchase.invoiceDate)}</span>
              </div>
            )}
            {purchase.notes && (
              <div className="pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Notes</span>
                <p className="text-slate-700 mt-0.5 italic">{purchase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Status & Balance */}
        <Card className={isCancelled ? 'bg-red-50/40 border-red-200' : 'bg-slate-50/50'}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold">Status & Balance</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={isCancelled ? 'danger' : 'success'}>
                  {purchase.status}
                </Badge>
                <Badge
                  variant={
                    purchase.paymentStatus === 'PAID'
                      ? 'success'
                      : purchase.paymentStatus === 'PARTIALLY_PAID'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {purchase.paymentStatus === 'PARTIALLY_PAID'
                    ? 'PARTIAL'
                    : purchase.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Grand Total:</span>
              <span className="font-bold text-slate-900 text-base">{formatINR(purchase.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Paid:</span>
              <span className="font-medium text-emerald-700">{formatINR(purchase.totalPaid)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
              <span className="font-semibold text-slate-700">Outstanding Balance:</span>
              <span
                className={`font-bold text-sm ${
                  purchase.outstandingAmount > 0 ? 'text-amber-700' : 'text-slate-700'
                }`}
              >
                {formatINR(purchase.outstandingAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Warning Banner if Cancelled */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-xs">
          <Ban className="w-5 h-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-sm">Purchase Order Cancelled</p>
            <p className="text-red-700 mt-0.5">
              This purchase order was cancelled. All received stock quantities were automatically reversed via STOCK_OUT.
            </p>
          </div>
        </div>
      )}

      {/* Section: Purchase Line Items */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-semibold">
              Purchase Items ({purchase.items.length} products, {totalUnits} total units)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Item Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900 text-xs">{item.productName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.productSku}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700 text-xs">
                    {formatINR(item.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900 text-xs">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 text-xs">
                    {formatINR(item.itemTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Row: Financial Summary (left) & Payment History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Summary Card (5 cols) */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-semibold">Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal ({totalUnits} units)</span>
                <span className="font-medium text-slate-900 text-sm">{formatINR(purchase.subtotal)}</span>
              </div>

              {purchase.discountAmount != null && purchase.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>
                    Discount {purchase.discountPercentage ? `(${purchase.discountPercentage}%)` : ''}
                  </span>
                  <span className="font-medium text-sm">-{formatINR(purchase.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-600">Taxable Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatINR(Math.max(0, purchase.subtotal - (purchase.discountAmount || 0)))}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tax ({purchase.taxRate || 0}%)</span>
                <span className="font-medium text-slate-900">+{formatINR(purchase.taxAmount || 0)}</span>
              </div>

              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-lg font-bold text-blue-700">{formatINR(purchase.grandTotal)}</span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Paid Amount:</span>
                  <span className="font-medium text-emerald-700">{formatINR(purchase.totalPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Outstanding Balance:</span>
                  <span className="font-bold text-amber-700">{formatINR(purchase.outstandingAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments History Card (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold">
                  Payment History ({purchase.payments.length})
                </CardTitle>
              </div>
              {!isCancelled && !isFullyPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                  onClick={handleOpenAddPayment}
                >
                  Add Payment
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {purchase.payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">No payment installments recorded yet.</p>
                  {!isCancelled && (
                    <p className="text-slate-400 mt-1">
                      Click &quot;Record Payment&quot; above to log an installment.
                    </p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {!isCancelled && <TableHead className="text-center w-20">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.payments.map((pmt) => (
                      <TableRow key={pmt.id}>
                        <TableCell className="text-xs text-slate-700 font-medium">
                          {formatDate(pmt.paymentDate)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {pmt.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {pmt.paymentReference || '—'}
                          {pmt.notes && (
                            <span className="block text-[11px] text-slate-400 italic">
                              {pmt.notes}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-700">
                          {formatINR(pmt.amount)}
                        </TableCell>
                        {!isCancelled && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-7 w-7 text-slate-500 hover:text-blue-600"
                                title="Edit payment"
                                onClick={() => handleOpenEditPayment(pmt)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-7 w-7 text-slate-500 hover:text-red-600"
                                title="Delete payment"
                                onClick={() => setPaymentToDelete(pmt)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record / Edit Payment Modal */}
      {isPaymentModalOpen && (
        <PurchasePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          purchase={purchase}
          paymentToEdit={paymentToEdit}
        />
      )}

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title={`Cancel Purchase ${purchase.purchaseNumber}?`}
        message={
          `Are you sure you want to cancel this purchase order?\n\n` +
          `• Supplier: ${purchase.supplier?.name || '—'}\n` +
          `• Items: ${purchase.items.length} (${totalUnits} units)\n` +
          `• Grand Total: ${formatINR(purchase.grandTotal)}\n\n` +
          `Warning: Cancellation will immediately record STOCK_OUT transactions to reverse inventory intake for all items. Cancellation is permanent.`
        }
        confirmLabel="Cancel Purchase"
        cancelLabel="Keep Purchase"
        isDestructive={true}
        isLoading={cancelPurchaseMutation.isPending}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
      />

      {/* Confirm Delete Payment Dialog */}
      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        title="Delete Payment Installment?"
        message={
          paymentToDelete
            ? `Are you sure you want to remove the payment of ${formatINR(paymentToDelete.amount)} recorded on ${formatDate(paymentToDelete.paymentDate)}?\n\nThe outstanding balance will increase accordingly.`
            : ''
        }
        confirmLabel="Delete Payment"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={deletePaymentMutation.isPending}
        onConfirm={handleConfirmDeletePayment}
        onCancel={() => setPaymentToDelete(null)}
      />
    </div>
  )
}
