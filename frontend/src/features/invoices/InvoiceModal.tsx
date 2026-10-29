import React from 'react'
import { Printer, Download, X, Building2, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { storefrontConfig } from '../../config/storefrontConfig'
import { formatDate, formatINR } from '../../utils/formatters'
import type { SaleResponse } from '../../types/sale.types'
import type { PurchaseResponse } from '../../types/purchase.types'
import { generateSaleInvoicePdf, generatePurchaseInvoicePdf } from './invoicePdfGenerator'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  sale?: SaleResponse | null
  purchase?: PurchaseResponse | null
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
  purchase,
}) => {
  if (!isOpen || (!sale && !purchase)) return null

  const isSale = Boolean(sale)
  const titleNumber = isSale ? sale?.saleNumber : purchase?.purchaseNumber

  const handlePrint = () => {
    window.print()
  }

  const handleExportPdf = () => {
    if (sale) {
      generateSaleInvoicePdf(sale)
    } else if (purchase) {
      generatePurchaseInvoicePdf(purchase)
    }
  }

  return (
    <>
      {/* Print Specific CSS to isolate the invoice sheet during window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Modal Backdrop & Outer Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
          
          {/* Top Actions Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-base">
                {isSale ? 'Tax Invoice' : 'Purchase Order Invoice'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-800 font-semibold border border-brand-200">
                {titleNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
                title="Print Invoice via Browser"
              >
                Print Invoice
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportPdf}
                title="Export as PDF file"
              >
                Download PDF
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-2"
                aria-label="Close invoice preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Document Area */}
          <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
            
            {/* The Document Sheet */}
            <div
              id="printable-invoice-container"
              className="bg-white border border-slate-300 shadow-md rounded-sm w-full max-w-[800px] text-slate-800 p-6 sm:p-10 font-sans"
            >
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-800 gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-brand-900 uppercase">
                    {storefrontConfig.storeName}
                  </h1>
                  <p className="text-xs font-semibold text-brand-700 tracking-wider uppercase mt-0.5">
                    {storefrontConfig.establishedText} • Premium Luggage & Bags Retailer
                  </p>
                  <p className="text-xs text-slate-600 mt-2 max-w-sm">
                    {storefrontConfig.address}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>Phone:</strong> {storefrontConfig.phone} • <strong>Hours:</strong> {storefrontConfig.businessHours}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 bg-brand-900 text-white font-bold text-xs rounded tracking-widest uppercase">
                    {isSale ? 'TAX INVOICE' : 'PURCHASE ORDER'}
                  </span>
                  <div className="mt-3 space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Document #: </span>
                      <strong className="font-mono text-slate-900 text-sm">{titleNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Date: </span>
                      <strong className="text-slate-900">
                        {isSale && sale ? formatDate(sale.saleDate) : purchase ? formatDate(purchase.purchaseDate) : ''}
                      </strong>
                    </div>
                    {isSale && sale?.status && (
                      <div>
                        <span className="text-slate-500">Status: </span>
                        <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
                          {sale.status}
                        </Badge>
                      </div>
                    )}
                    {!isSale && purchase?.invoiceNumber && (
                      <div>
                        <span className="text-slate-500">Supplier Bill #: </span>
                        <strong className="font-mono text-slate-900">{purchase.invoiceNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To / Party Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
                {isSale && (
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider mb-2">
                      <User className="w-3.5 h-3.5 text-brand-700" />
                      <span>Customer Details</span>
                    </div>
                    {sale?.customer ? (
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900">{sale.customer.name}</p>
                        <p className="text-slate-600"><strong>Phone:</strong> {sale.customer.phone}</p>
                        {sale.customer.email && (
                          <p className="text-slate-600"><strong>Email:</strong> {sale.customer.email}</p>
                        )}
                        {sale.customer.address && (
                          <p className="text-slate-600"><strong>Address:</strong> {sale.customer.address}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-slate-600">
                        <p className="font-semibold text-slate-900">Walk-in Customer</p>
                        <p>Counter Retail Sale</p>
                      </div>
                    )}
                  </div>
                )}

                {!isSale && (
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider mb-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Vendor / Supplier Details</span>
                    </div>
                    {purchase?.supplier ? (
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900">{purchase.supplier.name}</p>
                        {purchase.supplier.phones?.[0] && (
                          <p className="text-slate-600"><strong>Phone:</strong> {purchase.supplier.phones[0].phoneNumber}</p>
                        )}
                        {purchase.supplier.emails?.[0] && (
                          <p className="text-slate-600"><strong>Email:</strong> {purchase.supplier.emails[0].email}</p>
                        )}
                        {purchase.supplier.gstNumber && (
                          <p className="text-slate-600"><strong>GSTIN:</strong> {purchase.supplier.gstNumber}</p>
                        )}
                        {purchase.supplier.address && (
                          <p className="text-slate-600"><strong>Address:</strong> {purchase.supplier.address}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-600">Direct Inward Vendor</p>
                    )}
                  </div>
                )}

                {/* Payment Overview Box */}
                <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Information</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <strong className="text-slate-900">
                        {isSale
                          ? (sale?.paymentStatus || (sale?.dueAmount && sale.dueAmount > 0 ? 'PARTIAL / DUE' : 'PAID')).replace('_', ' ')
                          : (purchase?.paymentStatus || 'PAID').replace('_', ' ')}
                      </strong>
                    </div>
                    {isSale && sale?.payment?.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method:</span>
                        <strong className="text-slate-900">{sale.payment.paymentMethod}</strong>
                      </div>
                    )}
                    {isSale && sale?.dueAmount != null && sale.dueAmount > 0 && (
                      <div className="flex justify-between text-amber-800 font-bold">
                        <span>Balance Due:</span>
                        <span>{formatINR(sale.dueAmount)}</span>
                      </div>
                    )}
                    {!isSale && purchase?.outstandingAmount != null && purchase.outstandingAmount > 0 && (
                      <div className="flex justify-between text-amber-800 font-bold">
                        <span>Balance to Pay:</span>
                        <span>{formatINR(purchase.outstandingAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto my-6 border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 w-32">SKU / Code</th>
                      <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">
                        {isSale ? 'Unit Price' : 'Unit Cost'}
                      </th>
                      <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isSale &&
                      sale?.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.productName || 'General Item'}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.sku || item.barcode || '—'}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatINR(item.sellingPrice)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(item.itemTotal)}</td>
                        </tr>
                      ))}

                    {!isSale &&
                      purchase?.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.productName || 'General Item'}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.productSku || '—'}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatINR(item.purchasePrice)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(item.itemTotal)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary & Footers */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                
                {/* Left Terms & Notes */}
                <div className="w-full sm:w-1/2 text-xs text-slate-500 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-slate-700 uppercase tracking-wide">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Terms & Conditions</span>
                  </div>
                  {isSale ? (
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Goods once sold can be exchanged within 7 days in undamaged original condition.</li>
                      <li>Please retain this invoice for product warranty services.</li>
                      <li>Authorized warranty claims subject to manufacturer terms.</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>All stock items received were inspected against physical invoice.</li>
                      <li>Supplier payments processed per agreed payment terms.</li>
                    </ol>
                  )}
                </div>

                {/* Right Financial Box */}
                <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatINR(isSale ? sale?.subtotal ?? 0 : purchase?.subtotal ?? 0)}</span>
                  </div>

                  {isSale && sale?.discountAmount != null && sale.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount {sale.discountPercentage ? `(${sale.discountPercentage}%)` : ''}:</span>
                      <span>-{formatINR(sale.discountAmount)}</span>
                    </div>
                  )}

                  {!isSale && purchase?.discountAmount != null && purchase.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-{formatINR(purchase.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-b border-slate-300 py-2">
                    <span>Grand Total:</span>
                    <span className="text-base text-brand-900">
                      {formatINR(isSale ? sale?.grandTotal ?? 0 : purchase?.grandTotal ?? 0)}
                    </span>
                  </div>

                  {isSale && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Amount Paid:</span>
                        <span className="font-semibold text-emerald-700">
                          {formatINR(sale?.paidAmount ?? (sale?.payment?.amount ?? sale?.grandTotal ?? 0))}
                        </span>
                      </div>
                      {sale?.dueAmount != null && sale.dueAmount > 0 && (
                        <div className="flex justify-between font-bold text-amber-700">
                          <span>Remaining Balance:</span>
                          <span>{formatINR(sale.dueAmount)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {!isSale && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Paid:</span>
                        <span className="font-semibold text-emerald-700">
                          {formatINR(purchase?.totalPaid ?? 0)}
                        </span>
                      </div>
                      {purchase?.outstandingAmount != null && purchase.outstandingAmount > 0 && (
                        <div className="flex justify-between font-bold text-amber-700">
                          <span>Outstanding Due:</span>
                          <span>{formatINR(purchase.outstandingAmount)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Signatures & Footer Note */}
              <div className="flex justify-between items-end pt-12 mt-6 border-t border-slate-200 text-xs">
                <div className="text-[11px] text-slate-400">
                  Computer generated tax invoice • Roopam Bag Mall ERP
                </div>
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-1.5" />
                  <span className="font-medium text-slate-600 text-xs">Authorized Signatory</span>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-3 px-6 py-3 border-t border-slate-200 bg-white no-print">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportPdf}
            >
              Export PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>

        </div>
      </div>
    </>
  )
}
