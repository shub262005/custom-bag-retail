import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { CameraScanner } from '../../components/products/CameraScanner'
import { deviceRequest, ScannerRequestError, type RelayScan, type RelayStatus } from './scannerApi'

interface PhoneSession { id: string; token: string; expiresAt: string }
interface Pending { id: string; code: string; targetId: string }
const STORAGE = 'phone-scanner-session'
const PENDING = 'phone-scanner-pending'
function saved<T>(key: string): T | null { try { return JSON.parse(sessionStorage.getItem(key) || 'null') as T | null } catch { return null } }

export function PhoneScannerPage() {
  const [pairing] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return { id: params.get('session') || '', token: params.get('token') || '' }
  })
  const [session, setSession] = useState<PhoneSession | null>(() => {
    const stored = saved<PhoneSession>(STORAGE)
    return stored && (!pairing.id || stored.id === pairing.id) ? stored : null
  })
  const [pending, setPending] = useState<Pending | null>(() => session ? saved<Pending>(PENDING) : null)
  const [busy, setBusy] = useState(false)
  const [camera, setCamera] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [code, setCode] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [notice, setNotice] = useState('')
  const [destination, setDestination] = useState<{ id: string; label: string } | null>(null)
  const lastTarget = useRef('')

  async function pair() {
    setBusy(true); setError('')
    try {
      const device = await deviceRequest<{ token: string; expiresAt: string }>(pairing.id, 'pair', undefined, { token: pairing.token })
      const next = { id: pairing.id, ...device }
      sessionStorage.setItem(STORAGE, JSON.stringify(next))
      sessionStorage.removeItem(PENDING)
      window.history.replaceState(null, '', window.location.pathname)
      setSession(next); setPending(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Pairing failed. Create a new link on the PC.') }
    finally { setBusy(false) }
  }

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    async function tick() {
      try {
        if (Date.now() >= Date.parse(session!.expiresAt)) throw new ScannerRequestError(410, 'Session expired. Reconnect from the PC.')
        let scan: RelayScan | null = null
        if (pending) scan = await deviceRequest<RelayScan>(session!.id, 'scans', session!.token, pending, controller.signal)
        const status = await deviceRequest<RelayStatus>(session!.id, `status${pending ? `?scanId=${encodeURIComponent(pending.id)}` : ''}`, session!.token, undefined, controller.signal)
        if (cancelled) return
        if (lastTarget.current !== status.targetId) {
          lastTarget.current = status.targetId
          setCamera(false); setCode(''); setNotice(''); setError('')
        }
        setDestination({ id: status.targetId, label: status.targetLabel })
        setReady(status.accepting); setConnectionError('')
        if (!status.accepting) setCamera(false)
        scan = status.scan ?? scan
        if (scan && scan.status !== 'PENDING') {
          sessionStorage.removeItem(PENDING); setPending(null)
          if (scan.status === 'ADDED') { setNotice(scan.message); setCode('') }
          else { setNotice(''); setError(scan.message) }
          return
        }
      } catch (err) {
        if (cancelled) return
        setReady(false)
        setCamera(false)
        const message = err instanceof Error ? err.message : 'Connection interrupted. Reconnecting…'
        setConnectionError(message)
        if (err instanceof ScannerRequestError && [400, 403, 404, 409, 410, 429].includes(err.status)) {
          if (pending) { sessionStorage.removeItem(PENDING); setPending(null); setError(message) }
          if ([403, 404, 410].includes(err.status)) { sessionStorage.removeItem(STORAGE); setSession(null); setError(message) }
          if (pending || [403, 404, 410].includes(err.status)) return
        }
      }
      if (!cancelled) timer = setTimeout(() => void tick(), pending ? 700 : 1500)
    }
    void tick()
    return () => { cancelled = true; controller.abort(); clearTimeout(timer) }
  }, [session, pending])

  function send(raw: string) {
    setCamera(false)
    if (!session || pending || !ready || !destination) return
    const value = raw.trim()
    if (!value || value.length > 50) { setError('Scan a product SKU or barcode of up to 50 characters.'); return }
    const request = { id: crypto.randomUUID(), code: value, targetId: destination.id }
    setHasScanned(true)
    sessionStorage.setItem(PENDING, JSON.stringify(request))
    setNotice(''); setError(''); setPending(request)
  }
  return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto max-w-lg space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h1 className="text-xl font-bold">Phone product scanner</h1>
    <p className="text-sm text-slate-600">Send a product code to the current PC form. Sales/purchases add one unit; Add/Edit Product fills the barcode field. Switch staff pages on the PC without pairing again.</p>
    {!session ? <><p className="text-sm">On your PC, open Add/Edit Product, Sales or Purchases and choose Connect phone scanner. Scan the pairing QR with this phone’s Camera app.</p>
      {pairing.id && pairing.token && <Button className="w-full" isLoading={busy} onClick={() => void pair()}>Pair phone with PC form</Button>}</>
      : <><p role="status" className={`rounded-lg p-3 text-sm ${ready ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{pending ? 'Waiting for PC confirmation. Keep this page open…' : ready ? 'PC connected · ready to scan' : 'PC paused. Complete the current form on the PC, or check its connection.'}</p>
        <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold">Scanning for: {destination?.label ?? 'Waiting for PC destination…'}</p>
        <Button className="w-full" disabled={!ready || !!pending} onClick={() => { setError(''); setNotice(''); setCamera(value => !value) }}>{camera ? 'Stop camera' : hasScanned ? 'Scan next product' : 'Scan product'}</Button>
        {hasScanned && !pending && <p className="text-sm text-slate-600">Keep this page open; your phone stays paired. When registering products, choose Save &amp; Add Another on the PC, then tap Scan next product here.</p>}
        {camera && ready && !pending && <CameraScanner onScan={send} onError={message => { setCamera(false); setError(message) }} />}
        <Input label="Or enter product SKU / barcode" value={code} disabled={!!pending} maxLength={50} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (ready) send(code) } }} />
        <Button variant="secondary" className="w-full" disabled={!ready || !!pending || !code.trim()} onClick={() => send(code)}>Send code to PC</Button>
        <p className="text-xs text-slate-500">Expires at {new Date(session.expiresAt).toLocaleTimeString()}. Pairing stays open while switching staff pages. Review and save on the PC. To end pairing, open Manage phone scanner on the PC and click Disconnect phone.</p></>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {session && connectionError && <p role="alert" className="text-sm text-red-700">{connectionError}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
  </div></main>
}
