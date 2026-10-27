import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { resolveProductScan } from './productScan'
import type { ProductResponse } from '../../types/product.types'
import { CameraScanner } from './CameraScanner'
import { PhoneScannerConnection } from './PhoneScannerConnection'
import type { ScanOutcome } from '../../features/scanner/scannerApi'

interface Props {
  products: ProductResponse[]
  disabled?: boolean
  onProduct: (product: ProductResponse) => string | undefined
  label: string
}

export function ProductScanner({ products, disabled = false, onProduct, label }: Props) {
  const [code, setCode] = useState('')
  const [camera, setCamera] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const input = useRef<HTMLInputElement>(null)
  function accept(raw: string): ScanOutcome {
    if (disabled) return { accepted: false, message: 'PC is paused. Scan again when the bill is ready.' }
    setNotice('')
    const match = resolveProductScan(products, raw)
    if (!match.product) { setError(match.error!); return { accepted: false, message: match.error! } }
    const message = onProduct(match.product)
    setError(message ?? '')
    if (!message) {
      setCode('')
      setNotice(`${match.product.name}: added 1 unit.`)
    }
    return { accepted: !message, message: message || `${match.product.name}: added 1 unit.` }
  }

  return <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1"><Input ref={input} label="Scan product SKU / barcode" value={code} disabled={disabled}
        placeholder="Focus here, then scan" autoComplete="off" maxLength={1000}
        onChange={e => setCode(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); accept(e.currentTarget.value) } }} /></div>
      <Button disabled={disabled || !code.trim()} onClick={() => { accept(code); input.current?.focus() }}>Add code</Button>
      <Button variant="secondary" disabled={disabled} onClick={() => { setError(''); setNotice(''); setCamera(value => !value) }}>{camera ? 'Stop camera' : 'Scan with camera'}</Button>
    </div>
    <p className="text-xs text-slate-600">Use a keyboard-mode scanner with Enter suffix, or this device’s camera. QR labels must contain the product’s exact SKU or barcode. Each scan adds one unit.</p>
    {camera && !disabled && <CameraScanner onScan={raw => { accept(raw); setCamera(false); input.current?.focus() }} onError={message => { setError(message); setCamera(false) }} />}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    <PhoneScannerConnection disabled={disabled} onScan={accept} label={label} />
  </div>
}
