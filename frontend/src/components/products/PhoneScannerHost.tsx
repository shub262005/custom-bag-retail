import { useEffect, useRef, useState } from 'react'
import { axiosClient } from '../../api/axiosClient'
import { getStoredToken } from '../../auth/authStorage'
import { getErrorMessage } from '../../api/errorParser'
import { phoneOrigin, type Pairing, type RelayStatus, type ScanOutcome } from '../../features/scanner/scannerApi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { usePhoneScanner } from '../../features/scanner/phoneScannerState'
import { dispatchPhoneScan } from '../../features/scanner/scannerRouting'
import { createSerialPoller } from '../../features/scanner/serialPoller'
import { Smartphone, X, QrCode } from 'lucide-react'

export function PhoneScannerHost() {
  const { target, getTarget, expanded, show, hide, phoneConnected, setPhoneConnected } = usePhoneScanner()
  const disabled = !target || target.disabled
  const [origin, setOrigin] = useState<string>(import.meta.env.VITE_PHONE_ORIGIN || (window.location.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) ? window.location.origin : ''))
  const [session, setSession] = useState<Pairing | null>(null)
  const [qr, setQr] = useState('')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const wakePoll = useRef<(() => void) | null>(null)
  useEffect(() => { if (!session) setPhoneConnected(false) }, [session, setPhoneConnected])

  async function connect() {
    setBusy(true); setError('')
    let created: Pairing | undefined
    try {
      const base = phoneOrigin(origin.trim())
      const { data } = await axiosClient.post<Pairing>('/scanner/sessions')
      created = data
      const url = `${base}/phone-scanner#session=${encodeURIComponent(data.id)}&token=${encodeURIComponent(data.pairingToken)}`
      const QRCode = await import('qrcode')
      const image = await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      setLink(url); setQr(image); setStatus('Waiting for phone…'); setSession(data)
    } catch (err) {
      if (created) void axiosClient.delete(`/scanner/sessions/${created.id}`).catch(() => {})
      setError(getErrorMessage(err))
    } finally { setBusy(false) }
  }

  // Serialize destination changes with polling so a slow old request cannot overwrite a new destination.
  useEffect(() => { wakePoll.current?.() }, [disabled, target?.id])

  useEffect(() => {
    if (!session) return
    let stopped = false
    const outcomes = new Map<string, ScanOutcome>()
    const controller = new AbortController()
    const close = () => {
      const token = getStoredToken()
      if (token) void fetch(`/api/v1/scanner/sessions/${session.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {})
    }
    async function poll() {
      try {
        if (Date.now() >= Date.parse(session!.expiresAt)) { setSession(null); setError('Pairing expired. Connect the phone again.'); return }
        const destination = getTarget()
        const { data } = await axiosClient.post<RelayStatus>(`/scanner/sessions/${session!.id}/poll`, { accepting: !!destination && !destination.disabled, targetId: destination?.id ?? 'idle', targetLabel: destination?.label ?? 'Waiting for a scan-enabled form' }, { signal: controller.signal })
        if (stopped) return
        setPhoneConnected(data.connected)
        const current = getTarget()
        setStatus(data.connected ? !current || current.disabled ? 'Phone connected · scanning paused' : 'Phone connected · ready to scan' : 'Waiting for phone…')
        setError('')
        if (data.connected) { setQr(''); setLink('') }
        if (data.scan) {
          let result = outcomes.get(data.scan.id)
          if (!result) {
            result = dispatchPhoneScan(data.scan, current)
            outcomes.set(data.scan.id, result)
          }
          // Retain the outcome before acknowledging: retrying a failed ack never adds twice.
          await axiosClient.post(`/scanner/sessions/${session!.id}/scans/${data.scan.id}/ack`, result, { signal: controller.signal })
        }
      } catch (err) {
        if (stopped) return
        setPhoneConnected(false)
        setError(getErrorMessage(err))
        if (typeof err === 'object' && err && 'response' in err && [401, 403, 404, 410].includes((err as { response?: { status: number } }).response?.status ?? 0)) { setSession(null); return }
        setStatus('Connection interrupted · retrying…')
      }
    }
    const polling = createSerialPoller(poll, 900, err => { if (!stopped) setError(getErrorMessage(err)) })
    wakePoll.current = polling.wake
    polling.wake()
    window.addEventListener('pagehide', close)
    return () => { stopped = true; polling.stop(); wakePoll.current = null; controller.abort(); window.removeEventListener('pagehide', close); close() }
  }, [session, getTarget, setPhoneConnected])

  const connectionLabel = !session ? 'Not paired' : !phoneConnected ? status.startsWith('Connection interrupted') ? 'Reconnecting' : 'Waiting for phone' : disabled ? 'Paused' : 'Ready'
  const badgeColor = phoneConnected && !disabled ? 'bg-emerald-50 text-emerald-700' : session ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
  if (!target && !session && !expanded && !error) return null

  return <section aria-label="Persistent phone scanner" className={expanded ? 'fixed right-4 top-16 z-[70] max-h-[80dvh] w-[min(380px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl' : 'mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3'}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Smartphone className="h-4 w-4" /></div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-slate-900">Phone scanner</h2><span role="status" className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}>{connectionLabel}</span></div>
          {!expanded && <p className="mt-0.5 truncate text-xs text-slate-500">{target?.label ?? 'Open a form to start scanning'}</p>}</div>
      </div>
      {expanded ? <Button variant="ghost" size="sm" aria-label="Close scanner controls" onClick={hide}><X className="h-4 w-4" /></Button> : <Button variant="secondary" size="sm" aria-expanded={expanded} onClick={show}>{session ? 'Manage' : 'Connect phone'}</Button>}
    </div>
    {expanded && <div className="mt-4 space-y-4">
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Scanning for</p><p className="mt-1 text-sm font-medium text-slate-700">{target?.label ?? 'Open a sale, purchase or product form'}</p></div>
      {!session ? <div className="space-y-3"><Input label="PC address" placeholder="https://192.168.1.10:5173" value={origin} onChange={e => setOrigin(e.target.value)} disabled={busy} helperText="The HTTPS address your phone can reach on this Wi-Fi." /><Button className="w-full" leftIcon={<QrCode className="h-4 w-4" />} isLoading={busy} onClick={() => void connect()}>Show pairing QR code</Button></div>
        : <>
          {qr ? <div className="space-y-3 text-center"><img src={qr} alt="Scan to pair your phone" width={280} height={280} className="mx-auto max-w-full rounded-lg border border-slate-100" /><p className="text-sm leading-6 text-slate-600">Scan with your phone’s Camera app, open the link, then tap <strong>Pair phone</strong>.</p><a href={link} target="_blank" rel="noreferrer" className="inline-block text-xs font-medium text-blue-600 underline underline-offset-2">Open scanner link</a></div>
            : <p className="text-sm leading-6 text-slate-600">{disabled ? 'Your phone stays paired. Open or finish a product, sale or purchase form to continue.' : 'Scan from your phone. Codes go straight to the form shown above.'}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Paired until {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { setSession(null); setQr(''); setLink('') }}>Disconnect</Button></div>
        </>}
      <details className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500"><summary className="w-fit cursor-pointer font-medium text-slate-600">Help connecting</summary><p className="mt-2">Keep both devices on the same Wi-Fi and install the local certificate on your phone. Switching staff pages keeps your phone paired; refreshing the PC or signing out ends the connection.</p></details>
    </div>}
    {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </section>
}
