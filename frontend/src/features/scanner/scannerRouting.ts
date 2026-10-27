import type { RelayScan, ScanOutcome } from './scannerApi'

interface Destination { id: string; disabled: boolean; onScan: (code: string) => ScanOutcome }

export function dispatchPhoneScan(scan: Pick<RelayScan, 'targetId' | 'code'>, current: Destination | null): ScanOutcome {
  if (!current || current.disabled || current.id !== scan.targetId) {
    return { accepted: false, message: 'PC form changed or is paused. Check the current destination on your phone and scan again.' }
  }
  return current.onScan(scan.code)
}
