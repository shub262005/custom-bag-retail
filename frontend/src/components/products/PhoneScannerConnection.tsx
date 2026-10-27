import { useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { usePhoneScanner, type ScannerTarget } from '../../features/scanner/phoneScannerState'
import { useLocation } from 'react-router-dom'
import type { ScanOutcome } from '../../features/scanner/scannerApi'
import { Smartphone } from 'lucide-react'

// Forms register a destination; the staff layout owns the persistent connection.
export function PhoneScannerConnection({ disabled, onScan, label, pauseReason }: { disabled: boolean; onScan: (code: string) => ScanOutcome; label: string; pauseReason?: string }) {
  const { register, refresh, show, phoneConnected } = usePhoneScanner()
  const [instance] = useState(() => `form-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const location = useLocation()
  const id = `${instance}-${location.key}`
  const latest = useRef<ScannerTarget>({ id, label, disabled, onScan })
  useLayoutEffect(() => { latest.current = { id, label, disabled, onScan }; refresh() }, [id, label, disabled, onScan, refresh])
  useLayoutEffect(() => register(() => latest.current), [register])
  return <div className="space-y-2 border-t border-blue-200 pt-3">
    {phoneConnected && <p role="status" className={`rounded-md p-2.5 text-sm leading-5 ${disabled ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>{disabled ? pauseReason || 'Phone paired · scanning paused while this form is busy.' : 'Phone connected. Start a scan on your phone; the code fills in automatically.'}</p>}
    <div className="flex flex-wrap items-center gap-3"><Button variant="secondary" size="sm" leftIcon={<Smartphone className="h-4 w-4" />} onClick={show}>{phoneConnected ? 'Phone settings' : 'Use phone camera'}</Button><p className="text-xs text-slate-500">Stays paired when you switch pages.</p></div>
  </div>
}
