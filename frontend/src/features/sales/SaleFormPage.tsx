import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import { useProducts } from '../products/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getValidationErrors } from '../../api/errorParser'
import { formatINR } from '../../utils/formatters'
import type { ProductResponse } from '../../types/product.types'
import type { SaleResponse, SaleEditRequest } from '../../types/sale.types'
import type { PaymentMethod } from '../../types/common.types'
import { useSale, useCreateSale, useUpdateSale, validSaleId } from './useSales'
import { localToday, paymentOptions, paymentLabel, roundMoney } from './saleForm'

interface Row { productId: number; name: string; sku: string; quantity: string; price: string }
export function SaleFormPage({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const { id } = useParams()
  const saleId = Number(id)
  const query = useSale(mode === 'edit' ? saleId : NaN)
  if (mode === 'edit') {
    if (!validSaleId(saleId)) return <ErrorAlert message="Invalid sale ID." />
    if (query.isPending) return <SkeletonTable rows={5} cols={5} />
    if (query.isError) return <ErrorAlert message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
    if (query.data.status === 'CANCELLED') return <div className="space-y-4"><ErrorAlert message="This sale is CANCELLED and cannot be edited." /><Link to={`/sales/${saleId}`}><Button>View Sale Details</Button></Link></div>
    return <SaleForm key={saleId} original={query.data} />
  }
  return <SaleForm />
}
function SaleForm({ original }: { original?: SaleResponse }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateSale()
  const update = useUpdateSale()
  const sending = useRef(false)
  const pending = create.isPending || update.isPending
  const [rows, setRows] = useState<Row[]>(() => original?.items.map(i => ({ productId: i.productId ?? 0, name: i.productName ?? 'Unavailable product', sku: i.sku ?? '—', quantity: String(i.quantity), price: String(i.sellingPrice) })) ?? [])
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const { productsQuery: catalogue } = useProducts()
  const { productsQuery: results } = useProducts({ status: 'ACTIVE', searchQuery: debounced })
  const [date, setDate] = useState(original?.saleDate ?? localToday())
  const [discountMode, setDiscountMode] = useState<'NONE' | 'PERCENTAGE' | 'FIXED'>(original?.discountPercentage ? 'PERCENTAGE' : original?.discountAmount ? 'FIXED' : 'NONE')
  const [discount, setDiscount] = useState(String(original?.discountPercentage || original?.discountAmount || 0))
  const [method, setMethod] = useState<PaymentMethod | ''>(original?.payment?.paymentMethod ?? '')
  const [description, setDescription] = useState(original?.payment?.description ?? '')
  const [reduce, setReduce] = useState(true)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string> | undefined>()
  const [review, setReview] = useState(false)
  const [saved, setSaved] = useState<SaleResponse | null>(null)
  const products = catalogue.data ?? []
  const visible = (results.data ?? []).filter(p => p.status === 'ACTIVE')
  const oldQty = (id: number) => original?.items.find(i => i.productId === id)?.quantity ?? 0
  const available = (id: number) => (products.find(p => p.id === id)?.stockQuantity ?? 0) + oldQty(id)
  const subtotal = roundMoney(rows.reduce((sum, r) => sum + roundMoney(Number(r.price) || 0) * (Number(r.quantity) || 0), 0))
  const discountAmount = discountMode === 'PERCENTAGE' ? roundMoney(subtotal * (Number(discount) || 0) / 100) : discountMode === 'FIXED' ? roundMoney(Number(discount) || 0) : 0
  const total = Math.max(0, roundMoney(subtotal - discountAmount))
  const changeRow = (id: number, field: 'quantity' | 'price', value: string) => setRows(prev => prev.map(r => r.productId === id ? { ...r, [field]: value } : r))
  function add(product: ProductResponse) {
    const row = rows.find(r => r.productId === product.id)
    const quantity = row ? Number(row.quantity) + 1 : 1
    if (!Number.isInteger(quantity) || quantity > available(product.id)) { setError('Requested quantity exceeds available stock.'); return }
    setError('')
    setRows(prev => row ? prev.map(r => r.productId === product.id ? { ...r, quantity: String(quantity) } : r) : [...prev, { productId: product.id, name: product.name, sku: product.sku, quantity: '1', price: String(product.sellingPrice) }])
  }
  function validate() {
    let message = ''
    if (!date || date > localToday()) message = 'Sale date is required and cannot be in the future.'
    else if (catalogue.isError || !catalogue.data) message = 'Load current product stock before continuing.'
    else if (!rows.length) message = 'Add at least one product.'
    else for (const r of rows) {
      const product = products.find(p => p.id === r.productId)
      if (!product) { message = `${r.name}: product is unavailable.`; break }
      if (!oldQty(r.productId) && product.status !== 'ACTIVE') { message = `${r.name}: inactive products cannot be added.`; break }
      if (!r.quantity.trim() || !Number.isSafeInteger(Number(r.quantity)) || Number(r.quantity) < 1 || Number(r.quantity) > available(r.productId)) { message = `${r.name}: quantity must be a whole number from 1 to ${available(r.productId)}.`; break }
      if (!r.price.trim() || !Number.isFinite(Number(r.price)) || Number(r.price) < 0) { message = `${r.name}: selling price must be zero or greater.`; break }
    }
    if (!message && discountMode !== 'NONE' && (!discount.trim() || !Number.isFinite(Number(discount)) || Number(discount) < 0 || (discountMode === 'PERCENTAGE' && Number(discount) > 100) || (discountMode === 'FIXED' && Number(discount) > subtotal))) message = 'Enter a valid discount: percentage 0–100, or fixed amount no greater than subtotal.'
    if (!message && total > 0 && !method) message = 'Select a payment method for a positive sale total.'
    if (!message && description.length > 255) message = 'Payment description must be at most 255 characters.'
    setError(message)
    return !message
  }
  async function submit() {
    if (sending.current || !validate()) { setReview(false); return }
    sending.current = true
    setFields(undefined)
    const data: SaleEditRequest = { saleDate: date, items: rows.map(r => ({ productId: r.productId, quantity: Number(r.quantity), sellingPrice: Number(r.price) })), paymentMethod: method || undefined, paymentDescription: description.trim() || undefined, ...(discountMode === 'PERCENTAGE' ? { discountPercentage: Number(discount) } : discountMode === 'FIXED' ? { discountAmount: Number(discount) } : {}), ...(original ? { reducePaymentOnTotalDecrease: reduce } : {}) }
    try {
      const sale = original ? await update.mutateAsync({ id: original.id, data }) : await create.mutateAsync(data)
      toast.success(`${sale.saleNumber} ${original ? 'updated' : 'completed'}.`)
      setReview(false)
      if (original) navigate(`/sales/${sale.id}`)
      else { setSaved(sale); setRows([]); setSearch(''); setDate(localToday()); setDiscountMode('NONE'); setDiscount('0'); setMethod(''); setDescription(''); setError('') }
    } catch (err) { setError(getErrorMessage(err)); setFields(getValidationErrors(err)); setReview(false); void catalogue.refetch(); void results.refetch() }
    finally { sending.current = false }
  }
  return <div className="space-y-4">
    <PageHeader title={original ? `Edit ${original.saleNumber}` : 'POS Checkout'} description="Create a sale using current product inventory." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: original ? 'Edit Sale' : 'POS' }]} actions={<Link to={original ? `/sales/${original.id}` : '/sales'}><Button variant="secondary">{original ? 'Back to Sale' : 'Sales History'}</Button></Link>} />
    {original && <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">Editing this completed sale may change inventory quantities. Available quantity includes the units already sold on this sale.</p>}
    {saved && <div role="status" className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">Sale <strong>{saved.saleNumber}</strong> completed · {formatINR(saved.grandTotal)}. <Link className="underline font-semibold" to={`/sales/${saved.id}`}>Open Sale Details</Link></div>}
    {error && <ErrorAlert message={error} validationErrors={fields} />}
    {catalogue.isError && <ErrorAlert message={getErrorMessage(catalogue.error)} onRetry={() => catalogue.refetch()} />}
    <form noValidate onSubmit={e => { e.preventDefault(); if (validate()) setReview(true) }}>
    <fieldset disabled={pending} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 disabled:opacity-70">
      <div className="space-y-4 min-w-0">
        <section className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <Input label="Product search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, SKU or barcode" onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} />
          {results.isPending ? <SkeletonTable rows={3} cols={4} /> : results.isError ? <ErrorAlert message={getErrorMessage(results.error)} onRetry={() => results.refetch()} /> : !visible.length ? <EmptyState title="No active products found" description="Try another name, SKU or barcode." /> : <div className="max-h-64 overflow-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price / Stock</TableHead><TableHead>Add</TableHead></TableRow></TableHeader><TableBody>{visible.map(p => <TableRow key={p.id}><TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.sku} · {p.barcode || 'No barcode'}</div></TableCell><TableCell>{formatINR(p.sellingPrice)}<div className={`text-xs ${p.stockQuantity <= p.minimumStock ? 'text-amber-700' : 'text-slate-500'}`}>{p.stockQuantity} in stock · {p.stockQuantity === 0 ? 'Out of stock' : p.stockQuantity <= p.minimumStock ? 'Low stock' : 'Available'}</div></TableCell><TableCell><Button type="button" size="sm" aria-label={`Add ${p.name}`} disabled={catalogue.isPending || catalogue.isError || p.stockQuantity === 0 || Number(rows.find(r => r.productId === p.id)?.quantity ?? 0) >= available(p.id)} onClick={() => add(p)}>Add</Button></TableCell></TableRow>)}</TableBody></Table></div>}
        </section>
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden"><h2 className="font-semibold p-4 border-b border-slate-200">Sale items · {rows.length} products</h2>{!rows.length ? <EmptyState title="Your cart is empty" description="Search and add a product to begin." /> : <Table><TableHeader><TableRow>{['Product / SKU', 'Available', 'Quantity', 'Selling Price', 'Line Total', ''].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(r => <TableRow key={r.productId}><TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.sku}{products.find(p => p.id === r.productId)?.status === 'INACTIVE' ? ' · Inactive (existing item)' : ''}</div></TableCell><TableCell>{catalogue.isPending ? '…' : available(r.productId)}</TableCell><TableCell><Input className="min-w-20" aria-label={`Quantity for ${r.name}`} type="number" min="1" step="1" max={available(r.productId)} value={r.quantity} onChange={e => changeRow(r.productId, 'quantity', e.target.value)} error={Number(r.quantity) > available(r.productId) ? 'Exceeds stock' : undefined} /></TableCell><TableCell><Input className="min-w-24" aria-label={`Selling price for ${r.name}`} type="number" min="0" step="0.01" value={r.price} onChange={e => changeRow(r.productId, 'price', e.target.value)} /></TableCell><TableCell>{formatINR(roundMoney(Number(r.price) || 0) * (Number(r.quantity) || 0))}</TableCell><TableCell><Button type="button" variant="ghost" aria-label={`Remove ${r.name}`} onClick={() => setRows(prev => prev.filter(i => i.productId !== r.productId))}>Remove</Button></TableCell></TableRow>)}</TableBody></Table>}</section>
      </div>
      <section className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 self-start">
        <h2 className="font-semibold">{original ? 'Sale summary' : 'Checkout summary'}</h2>
        <Input label="Sale date" type="date" required max={localToday()} value={date} onChange={e => setDate(e.target.value)} />
        <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>
        <Select label="Discount" value={discountMode} onChange={e => { setDiscountMode(e.target.value as typeof discountMode); setDiscount('0') }} options={[{ value: 'NONE', label: 'No Discount' }, { value: 'PERCENTAGE', label: 'Percentage' }, { value: 'FIXED', label: 'Fixed Amount' }]} />
        {discountMode !== 'NONE' && <Input label="Discount value" type="number" min="0" max={discountMode === 'PERCENTAGE' ? 100 : subtotal} step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />}
        <div className="flex justify-between text-sm"><span>Discount amount</span><span>{formatINR(discountAmount)}</span></div>
        <div className="flex justify-between font-semibold border-t border-slate-200 pt-3"><span>Estimated total</span><span>{formatINR(total)}</span></div>
        <p className="text-xs text-slate-500">Final totals are confirmed when the sale is saved.</p>
        <Select label="Payment method" value={method} required={total > 0} onChange={e => setMethod(e.target.value as PaymentMethod | '')} options={[{ value: '', label: total > 0 ? 'Select payment method' : 'Not required for zero total' }, ...paymentOptions]} />
        <Input label="Payment description" maxLength={255} value={description} onChange={e => setDescription(e.target.value)} helperText="Optional for all payment methods, including Other." />
        {original && <label className="flex gap-2 text-sm"><input type="checkbox" checked={reduce} onChange={e => setReduce(e.target.checked)} />Adjust payment amount automatically when sale total decreases</label>}
        <Button type="submit" className="w-full" disabled={!rows.length || catalogue.isPending || catalogue.isError} isLoading={pending}>{original ? 'Review Changes' : 'Review Checkout'}</Button>
      </section>
    </fieldset></form>
    <Modal isOpen={review} onClose={() => { if (!pending) setReview(false) }} title={original ? 'Review Sale Changes' : 'Review Checkout'} footer={<><Button variant="secondary" disabled={pending} onClick={() => setReview(false)}>Back</Button><Button isLoading={pending} disabled={pending} onClick={submit}>{original ? 'Save Sale Changes' : 'Complete Sale'}</Button></>}>
      <div className="space-y-3 text-sm"><p className="p-3 rounded bg-amber-50 text-amber-900">{original ? 'Saving this sale may change inventory quantities.' : 'Completing this sale will immediately deduct stock.'}</p><p>{rows.length} products · {rows.reduce((n, r) => n + Number(r.quantity), 0)} units · {date}</p>{rows.map(r => <div className="flex justify-between" key={r.productId}><span>{r.name} × {r.quantity}</span><span>{formatINR(Number(r.price))} each</span></div>)}<p>Subtotal: {formatINR(subtotal)} · Discount: {formatINR(discountAmount)}</p><p className="font-semibold">Estimated grand total: {formatINR(total)}</p><p>Payment: {paymentLabel(method || null)}</p>{original && <p>Automatically reduce payment on total decrease: {reduce ? 'Yes' : 'No'}</p>}</div>
    </Modal>
  </div>
}
