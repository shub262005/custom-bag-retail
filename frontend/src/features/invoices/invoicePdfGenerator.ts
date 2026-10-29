import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SaleResponse } from '../../types/sale.types'
import type { PurchaseResponse } from '../../types/purchase.types'
import { storefrontConfig } from '../../config/storefrontConfig'
import { formatDate } from '../../utils/formatters'

// Helper to format currency values cleanly without unicode symbols that might glitch in standard font
export function formatPdfMoney(amount: number | null | undefined): string {
  const val = Number(amount) || 0
  return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function buildSaleInvoicePdf(sale: SaleResponse): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // 1. Header Banner / Branding
  doc.setFillColor(136, 19, 55) // Brand Maroon #881337
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(storefrontConfig.storeName.toUpperCase(), 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${storefrontConfig.establishedText} | ${storefrontConfig.tagline}`, 14, 18)
  doc.text(`Ph: ${storefrontConfig.phone} | Kolhapur, Maharashtra`, 14, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('TAX INVOICE', pageWidth - 14, 15, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - 14, 21, { align: 'right' })

  // 2. Invoice Meta Info & Customer Details Cards
  doc.setTextColor(30, 41, 59)
  const y = 35

  // Left column: Bill To
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BILLED TO (CUSTOMER):', 14, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (sale.customer) {
    doc.setFont('helvetica', 'bold')
    doc.text(sale.customer.name, 14, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Phone: ${sale.customer.phone}`, 14, y + 10)
    if (sale.customer.email) {
      doc.text(`Email: ${sale.customer.email}`, 14, y + 15)
    }
    if (sale.customer.address) {
      doc.text(`Address: ${sale.customer.address.slice(0, 45)}`, 14, y + 20)
    }
  } else {
    doc.text('Walk-in Retail Customer', 14, y + 5)
    doc.text('Over-the-counter Cash/UPI Sale', 14, y + 10)
  }

  // Right column: Invoice Meta
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('INVOICE DETAILS:', pageWidth - 80, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Invoice No:`, pageWidth - 80, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(sale.saleNumber, pageWidth - 14, y + 5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text(`Date:`, pageWidth - 80, y + 10)
  doc.text(formatDate(sale.saleDate), pageWidth - 14, y + 10, { align: 'right' })

  doc.text(`Payment Status:`, pageWidth - 80, y + 15)
  const pStatus = sale.paymentStatus || (sale.dueAmount && sale.dueAmount > 0 ? 'PARTIAL / DUE' : 'PAID')
  doc.setFont('helvetica', 'bold')
  doc.text(pStatus.replace('_', ' '), pageWidth - 14, y + 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Mode:`, pageWidth - 80, y + 20)
  doc.text(sale.payment?.paymentMethod || 'CASH / COUNTER', pageWidth - 14, y + 20, { align: 'right' })

  // 3. Items Table
  const tableData = sale.items.map((item, idx) => [
    String(idx + 1),
    item.productName || 'General Product',
    item.sku || item.barcode || '—',
    String(item.quantity),
    formatPdfMoney(item.sellingPrice),
    formatPdfMoney(item.itemTotal),
  ])

  autoTable(doc, {
    startY: y + 28,
    head: [['#', 'Item Description', 'SKU / Code', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [136, 19, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
    },
  })

  // 4. Totals and Summary Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 6
  const summaryBoxWidth = 85
  const summaryX = pageWidth - summaryBoxWidth - 14

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.rect(summaryX, finalY, summaryBoxWidth, 38, 'FD')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', summaryX + 4, finalY + 7)
  doc.text(formatPdfMoney(sale.subtotal), pageWidth - 18, finalY + 7, { align: 'right' })

  if (sale.discountAmount != null && sale.discountAmount > 0) {
    const discLabel = sale.discountPercentage ? `Discount (${sale.discountPercentage}%):` : 'Discount:'
    doc.text(discLabel, summaryX + 4, finalY + 13)
    doc.text(`- ${formatPdfMoney(sale.discountAmount)}`, pageWidth - 18, finalY + 13, { align: 'right' })
  }

  doc.setDrawColor(203, 213, 225)
  doc.line(summaryX + 4, finalY + 18, pageWidth - 18, finalY + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(136, 19, 55)
  doc.text('Grand Total:', summaryX + 4, finalY + 24)
  doc.text(formatPdfMoney(sale.grandTotal), pageWidth - 18, finalY + 24, { align: 'right' })

  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  const paid = sale.paidAmount ?? (sale.payment?.amount ?? sale.grandTotal)
  doc.text('Amount Paid:', summaryX + 4, finalY + 30)
  doc.text(formatPdfMoney(paid), pageWidth - 18, finalY + 30, { align: 'right' })

  if (sale.dueAmount != null && sale.dueAmount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 83, 9) // Amber/warning
    doc.text('Balance Due:', summaryX + 4, finalY + 35)
    doc.text(formatPdfMoney(sale.dueAmount), pageWidth - 18, finalY + 35, { align: 'right' })
  }

  // Left Note / Terms & Conditions
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TERMS & CONDITIONS:', 14, finalY + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('1. Goods once sold can be exchanged within 7 days in undamaged condition.', 14, finalY + 13)
  doc.text('2. Please present this invoice for warranty and exchange claims.', 14, finalY + 18)
  doc.text('3. Roopam Bag Mall offers authorized manufacturer warranty on branded bags.', 14, finalY + 23)

  // 5. Signature and Footer
  const bottomY = Math.max(finalY + 50, 260)
  doc.setDrawColor(203, 213, 225)
  doc.line(pageWidth - 70, bottomY + 12, pageWidth - 14, bottomY + 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Authorized Signatory', pageWidth - 42, bottomY + 16, { align: 'center' })

  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Thank you for shopping with Roopam Bag Mall! Visit again.', pageWidth / 2, 285, { align: 'center' })

  return doc
}

export function buildPurchaseInvoicePdf(purchase: PurchaseResponse): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // 1. Header Banner / Branding
  doc.setFillColor(30, 41, 59) // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(storefrontConfig.storeName.toUpperCase(), 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Store & Warehouse Inward • Kolhapur, Maharashtra`, 14, 18)
  doc.text(`Ph: ${storefrontConfig.phone} | Tarabai Road`, 14, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('PURCHASE ORDER INVOICE', pageWidth - 14, 15, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SUPPLIER STOCK PROCUREMENT', pageWidth - 14, 21, { align: 'right' })

  // 2. Meta Info & Supplier Details
  doc.setTextColor(30, 41, 59)
  const y = 35

  // Left column: Supplier / Vendor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('VENDOR / SUPPLIER DETAILS:', 14, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (purchase.supplier) {
    doc.setFont('helvetica', 'bold')
    doc.text(purchase.supplier.name, 14, y + 5)
    doc.setFont('helvetica', 'normal')
    const phone = purchase.supplier.phones?.[0]?.phoneNumber
    const email = purchase.supplier.emails?.[0]?.email
    if (phone) {
      doc.text(`Phone: ${phone}`, 14, y + 10)
    }
    if (purchase.supplier.gstNumber) {
      doc.text(`GSTIN: ${purchase.supplier.gstNumber}`, 14, y + 15)
    } else if (email) {
      doc.text(`Email: ${email}`, 14, y + 15)
    }
    if (purchase.supplier.address) {
      doc.text(`Address: ${purchase.supplier.address.slice(0, 45)}`, 14, y + 20)
    }
  } else {
    doc.text('Standard Vendor / Direct Supplier', 14, y + 5)
  }

  // Right column: Purchase Order Details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PO & INVOICE REFERENCE:', pageWidth - 80, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`PO Number:`, pageWidth - 80, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(purchase.purchaseNumber, pageWidth - 14, y + 5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text(`PO Date:`, pageWidth - 80, y + 10)
  doc.text(formatDate(purchase.purchaseDate), pageWidth - 14, y + 10, { align: 'right' })

  doc.text(`Supplier Bill / Inv #:`, pageWidth - 80, y + 15)
  doc.setFont('helvetica', 'bold')
  doc.text(purchase.invoiceNumber || '—', pageWidth - 14, y + 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Status:`, pageWidth - 80, y + 20)
  doc.setFont('helvetica', 'bold')
  doc.text(purchase.paymentStatus.replace('_', ' '), pageWidth - 14, y + 20, { align: 'right' })

  // 3. Items Table
  const tableData = purchase.items.map((item, idx) => [
    String(idx + 1),
    item.productName || 'Inventory Product',
    item.productSku || '—',
    String(item.quantity),
    formatPdfMoney(item.purchasePrice),
    formatPdfMoney(item.itemTotal),
  ])

  autoTable(doc, {
    startY: y + 28,
    head: [['#', 'Item Name', 'SKU', 'Qty Received', 'Unit Cost', 'Total Cost']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
    },
  })

  // 4. Totals and Summary Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 6
  const summaryBoxWidth = 85
  const summaryX = pageWidth - summaryBoxWidth - 14

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.rect(summaryX, finalY, summaryBoxWidth, 38, 'FD')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', summaryX + 4, finalY + 7)
  doc.text(formatPdfMoney(purchase.subtotal), pageWidth - 18, finalY + 7, { align: 'right' })

  if (purchase.discountAmount != null && purchase.discountAmount > 0) {
    const discLabel = purchase.discountPercentage ? `Discount (${purchase.discountPercentage}%):` : 'Discount:'
    doc.text(discLabel, summaryX + 4, finalY + 13)
    doc.text(`- ${formatPdfMoney(purchase.discountAmount)}`, pageWidth - 18, finalY + 13, { align: 'right' })
  }

  doc.setDrawColor(203, 213, 225)
  doc.line(summaryX + 4, finalY + 18, pageWidth - 18, finalY + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(30, 41, 59)
  doc.text('Total Cost:', summaryX + 4, finalY + 24)
  doc.text(formatPdfMoney(purchase.grandTotal), pageWidth - 18, finalY + 24, { align: 'right' })

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)
  doc.text('Total Paid to Supplier:', summaryX + 4, finalY + 30)
  doc.text(formatPdfMoney(purchase.totalPaid), pageWidth - 18, finalY + 30, { align: 'right' })

  if (purchase.outstandingAmount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 83, 9)
    doc.text('Outstanding Due:', summaryX + 4, finalY + 35)
    doc.text(formatPdfMoney(purchase.outstandingAmount), pageWidth - 18, finalY + 35, { align: 'right' })
  }

  // Left Note / Inward Verification
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('STOCK INWARD VERIFICATION:', 14, finalY + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('1. All items listed above have been physically inspected and verified into store stock.', 14, finalY + 13)
  doc.text('2. Payments are disbursed according to supplier credit and payment records.', 14, finalY + 18)
  if (purchase.notes) {
    doc.text(`3. Note: ${purchase.notes.slice(0, 60)}`, 14, finalY + 23)
  }

  // 5. Signature
  const bottomY = Math.max(finalY + 50, 260)
  doc.setDrawColor(203, 213, 225)
  doc.line(pageWidth - 70, bottomY + 12, pageWidth - 14, bottomY + 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Store Manager / Verification', pageWidth - 42, bottomY + 16, { align: 'center' })

  return doc
}

// Directly prints the exact jsPDF document
export function printPdfDocument(doc: jsPDF) {
  doc.autoPrint()
  const blob = doc.output('blob')
  const blobUrl = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = blobUrl

  document.body.appendChild(iframe)

  const trigger = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.open(blobUrl, '_blank')
    }
  }

  iframe.onload = () => {
    setTimeout(trigger, 350)
  }

  // Fallback trigger in case iframe onload does not fire
  setTimeout(trigger, 1200)

  // Cleanup after print dialog interaction
  setTimeout(() => {
    try {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // ignore
    }
  }, 90000)
}

export function generateSaleInvoicePdf(sale: SaleResponse) {
  const doc = buildSaleInvoicePdf(sale)
  doc.save(`Invoice_${sale.saleNumber}.pdf`)
}

export function printSaleInvoicePdf(sale: SaleResponse) {
  const doc = buildSaleInvoicePdf(sale)
  printPdfDocument(doc)
}

export function generatePurchaseInvoicePdf(purchase: PurchaseResponse) {
  const doc = buildPurchaseInvoicePdf(purchase)
  doc.save(`PO_${purchase.purchaseNumber}.pdf`)
}

export function printPurchaseInvoicePdf(purchase: PurchaseResponse) {
  const doc = buildPurchaseInvoicePdf(purchase)
  printPdfDocument(doc)
}
