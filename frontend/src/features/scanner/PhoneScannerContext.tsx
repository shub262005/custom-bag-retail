import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ScannerContext, type ScannerContextValue, type ScannerTarget } from './phoneScannerState'

export function PhoneScannerProvider({ children }: { children: ReactNode }) {
  const active = useRef<(() => ScannerTarget) | null>(null)
  const [target, setTarget] = useState<ScannerContextValue['target']>(null)
  const [expanded, setExpanded] = useState(false)
  const [phoneConnected, setPhoneConnected] = useState(false)
  const getTarget = useCallback(() => active.current?.() ?? null, [])
  const refresh = useCallback(() => {
    const current = active.current?.()
    setTarget(prev => {
      if (!current) return prev === null ? prev : null
      if (prev?.id === current.id && prev.label === current.label && prev.disabled === current.disabled) return prev
      return { id: current.id, label: current.label, disabled: current.disabled }
    })
  }, [])
  const register = useCallback((get: () => ScannerTarget) => {
    active.current = get; refresh()
    return () => { if (active.current === get) { active.current = null; refresh() } }
  }, [refresh])
  const show = useCallback(() => setExpanded(true), [])
  const hide = useCallback(() => setExpanded(false), [])
  const value = useMemo(() => ({ target, getTarget, refresh, register, expanded, show, hide, phoneConnected, setPhoneConnected }), [target, getTarget, refresh, register, expanded, show, hide, phoneConnected])
  return <ScannerContext.Provider value={value}>{children}</ScannerContext.Provider>
}

