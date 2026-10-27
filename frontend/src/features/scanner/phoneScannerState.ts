import { createContext, useContext } from 'react'
import type { ScanOutcome } from './scannerApi'

export interface ScannerTarget { id: string; label: string; disabled: boolean; onScan: (code: string) => ScanOutcome }
export interface ScannerContextValue {
  target: Omit<ScannerTarget, 'onScan'> | null
  getTarget: () => ScannerTarget | null
  register: (get: () => ScannerTarget) => () => void
  refresh: () => void
  expanded: boolean
  show: () => void
  hide: () => void
  phoneConnected: boolean
  setPhoneConnected: (connected: boolean) => void
}
export const ScannerContext = createContext<ScannerContextValue | null>(null)
export function usePhoneScanner() {
  const context = useContext(ScannerContext)
  if (!context) throw new Error('Phone scanner needs the staff layout provider.')
  return context
}
