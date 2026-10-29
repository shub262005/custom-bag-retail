import React from 'react'
import { Printer, Download, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { storefrontConfig } from '../../config/storefrontConfig'
import { formatDate } from '../../utils/formatters'
import type { SaleResponse } from '../../types/sale.types'
import type { PurchaseResponse } from '../../types/purchase.types'
import {
  generateSaleInvoicePdf,
  generatePurchaseInvoicePdf,
  printSaleInvoicePdf,
  printPurchaseInvoicePdf,
  formatPdfMoney,
} from './invoicePdfGenerator'

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

  // Print button directly outputs the exact same PDF document as the export
  const handlePrint = () => {
    if (sale) {
      printSaleInvoicePdf(sale)
    } else if (purchase) {
      printPurchaseInvoicePdf(purchase)
    }
  }

  const handleExportPdf = () => {
    if (sale) {
      generateSaleInvoicePdf(sale)
    } else if (purchase) {
      generatePurchaseInvoicePdf(purchase)
    }
  }

  const paidAmount = isSale
    ? sale?.paidAmount ?? (sale?.payment?.amount ?? sale?.grandTotal ?? 0)
    : purchase?.totalPaid ?? 0

  const dueAmount = isSale
    ? sale?.dueAmount ?? 0
    : purchase?.outstandingAmount ?? 0

  const paymentStatusText = isSale
    ? (sale?.paymentStatus || (dueAmount > 0 ? 'PARTIALLY_PAID' : 'PAID')).replace('_', ' ')
    : (purchase?.paymentStatus || 'PAID').replace('_', ' ')

  const paymentModeText = isSale
    ? (sale?.payment?.paymentMethod || 'CASH / COUNTER').replace('_', ' ')
    : 'BANK / VENDOR ACCOUNT'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-base">
              {isSale ? 'Tax Invoice' : 'Purchase Order Invoice'}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#881337]/10 text-[#881337] font-bold border border-[#881337]/20">
              {titleNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              title="Print the exact Invoice PDF document"
              className="bg-[#881337] hover:bg-[#70102e] text-white"
            >
              Print Invoice
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportPdf}
              title="Download as PDF file"
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

        {/* Scrollable Preview Area (Rendered to match the PDF layout exactly) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white shadow-lg border border-slate-300 w-full max-w-[780px] text-slate-800 overflow-hidden font-sans">
            
            {/* 1. Header Banner (Solid Brand Maroon / Dark Navy) */}
            <div
              className={`p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                isSale ? 'bg-[#881337]' : 'bg-[#1e293b]'
              }`}
            >
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase">
                  {storefrontConfig.storeName}
                </h1>
                <p className="text-xs text-rose-100 mt-0.5">
                  {storefrontConfig.establishedText} | {storefrontConfig.tagline}
                </p>
                <p className="text-xs text-rose-100 mt-0.5">
                  Ph: {storefrontConfig.phone} | Kolhapur, Maharashtra
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-lg font-bold tracking-wider">
                  {isSale ? 'TAX INVOICE' : 'PURCHASE ORDER INVOICE'}
                </div>
                <div className="text-[10px] tracking-widest uppercase text-rose-200 mt-0.5">
                  {isSale ? 'ORIGINAL FOR RECIPIENT' : 'SUPPLIER PROCUREMENT COPY'}
                </div>
              </div>
            </div>

            {/* 2. Party & Document Meta Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-200">
              {/* Billed To / Supplier */}
              <div>
                <div className="font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                  {isSale ? 'BILLED TO (CUSTOMER):' : 'VENDOR / SUPPLIER DETAILS:'}
                </div>
                {isSale ? (
                  sale?.customer ? (
                    <div className="space-y-0.5 text-slate-700">
                      <div className="font-bold text-slate-900 text-sm">{sale.customer.name}</div>
                      <div>Phone: {sale.customer.phone}</div>
                      {sale.customer.email && <div>Email: {sale.customer.email}</div>}
                      {sale.customer.address && <div>Address: {sale.customer.address}</div>}
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-slate-700">
                      <div className="font-bold text-slate-900 text-sm">Walk-in Retail Customer</div>
                      <div>Over-the-counter Cash/UPI Sale</div>
                    </div>
                  )
                ) : purchase?.supplier ? (
                  <div className="space-y-0.5 text-slate-700">
                    <div className="font-bold text-slate-900 text-sm">{purchase.supplier.name}</div>
                    {purchase.supplier.phones?.[0] && (
                      <div>Phone: {purchase.supplier.phones[0].phoneNumber}</div>
                    )}
                    {purchase.supplier.gstNumber && <div>GSTIN: {purchase.supplier.gstNumber}</div>}
                    {purchase.supplier.address && <div>Address: {purchase.supplier.address}</div>}
                  </div>
                ) : (
                  <div className="text-slate-700">Standard Vendor / Direct Supplier</div>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="sm:text-right space-y-1">
                <div className="font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                  {isSale ? 'INVOICE DETAILS:' : 'PO REFERENCE:'}
                </div>
                <div className="flex sm:justify-end gap-3">
                  <span className="text-slate-500 w-28 text-left sm:text-right">{isSale ? 'Invoice No:' : 'PO Number:'}</span>
                  <span className="font-bold font-mono text-slate-900 min-w-32">{titleNumber}</span>
                </div>
                <div className="flex sm:justify-end gap-3">
                  <span className="text-slate-500 w-28 text-left sm:text-right">Date:</span>
                  <span className="font-medium text-slate-900 min-w-32">
                    {isSale && sale ? formatDate(sale.saleDate) : purchase ? formatDate(purchase.purchaseDate) : '—'}
                  </span>
                </div>
                <div className="flex sm:justify-end gap-3">
                  <span className="text-slate-500 w-28 text-left sm:text-right">Payment Status:</span>
                  <span className="font-bold text-slate-900 min-w-32 uppercase">{paymentStatusText}</span>
                </div>
                <div className="flex sm:justify-end gap-3">
                  <span className="text-slate-500 w-28 text-left sm:text-right">Payment Mode:</span>
                  <span className="font-medium text-slate-900 min-w-32 uppercase">{paymentModeText}</span>
                </div>
              </div>
            </div>

            {/* 3. Items Table (Maroon Header Matching PDF) */}
            <div className="p-6">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr
                    className={`text-white text-xs font-bold ${
                      isSale ? 'bg-[#881337]' : 'bg-[#1e293b]'
                    }`}
                  >
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-700/40">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-700/40">Item Description</th>
                    <th className="py-2.5 px-3 w-32 border-r border-slate-700/40">SKU / Code</th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-slate-700/40">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right border-r border-slate-700/40">
                      {isSale ? 'Unit Price' : 'Unit Cost'}
                    </th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isSale &&
                    sale?.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          {item.productName || 'General Product'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px] border-r border-slate-200">
                          {item.sku || item.barcode || '—'}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800 border-r border-slate-200">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-200">
                          {formatPdfMoney(item.sellingPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatPdfMoney(item.itemTotal)}
                        </td>
                      </tr>
                    ))}

                  {!isSale &&
                    purchase?.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          {item.productName || 'Inventory Product'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px] border-r border-slate-200">
                          {item.productSku || '—'}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800 border-r border-slate-200">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-200">
                          {formatPdfMoney(item.purchasePrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatPdfMoney(item.itemTotal)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 4. Terms on Left & Summary Box on Right */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
              {/* Terms */}
              <div className="w-full sm:w-1/2 text-slate-500 space-y-1 text-[11px]">
                <div className="font-bold text-slate-700 uppercase tracking-wide mb-1">
                  {isSale ? 'TERMS & CONDITIONS:' : 'STOCK INWARD VERIFICATION:'}
                </div>
                {isSale ? (
                  <>
                    <p>1. Goods once sold can be exchanged within 7 days in undamaged condition.</p>
                    <p>2. Please present this invoice for warranty and exchange claims.</p>
                    <p>3. Roopam Bag Mall offers authorized manufacturer warranty on branded bags.</p>
                  </>
                ) : (
                  <>
                    <p>1. All items listed above have been physically inspected and verified into store stock.</p>
                    <p>2. Payments are disbursed according to supplier credit and payment records.</p>
                  </>
                )}
              </div>

              {/* Totals Summary Box */}
              <div className="w-full sm:w-72 bg-slate-50/80 border border-slate-200 rounded p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatPdfMoney(isSale ? sale?.subtotal ?? 0 : purchase?.subtotal ?? 0)}
                  </span>
                </div>

                {isSale && sale?.discountAmount != null && sale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount {sale.discountPercentage ? `(${sale.discountPercentage}%)` : ''}:</span>
                    <span>- {formatPdfMoney(sale.discountAmount)}</span>
                  </div>
                )}

                {!isSale && purchase?.discountAmount != null && purchase.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- {formatPdfMoney(purchase.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-2">
                  <span>Grand Total:</span>
                  <span className={isSale ? 'text-[#881337]' : 'text-slate-900'}>
                    {formatPdfMoney(isSale ? sale?.grandTotal ?? 0 : purchase?.grandTotal ?? 0)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{isSale ? 'Amount Paid:' : 'Total Paid:'}</span>
                  <span className="font-semibold text-slate-800">{formatPdfMoney(paidAmount)}</span>
                </div>

                {dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-amber-700 pt-0.5">
                    <span>{isSale ? 'Balance Due:' : 'Outstanding Due:'}</span>
                    <span>{formatPdfMoney(dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Signature Footer */}
            <div className="px-6 pb-6 pt-4 flex justify-between items-end border-t border-slate-200 text-xs text-slate-400">
              <div className="text-[11px]">
                Thank you for shopping with Roopam Bag Mall! Visit again.
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-slate-400 mb-1" />
                <span className="text-[11px] text-slate-600 font-medium">Authorized Signatory</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex justify-end items-center gap-3 px-6 py-3 border-t border-slate-200 bg-white">
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
            className="bg-[#881337] hover:bg-[#70102e] text-white"
          >
            Print
          </Button>
        </div>

      </div>
    </div>
  )
}
