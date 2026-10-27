export interface ScanOutcome { accepted: boolean; message: string }
export interface RelayScan { id: string; code: string; status: 'PENDING' | 'ADDED' | 'REJECTED'; message: string; targetId: string }
export interface RelayStatus { connected: boolean; accepting: boolean; expiresAt: string; scan: RelayScan | null; targetId: string; targetLabel: string }
export interface Pairing { id: string; pairingToken: string; expiresAt: string }
export class ScannerRequestError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

// Separate from the staff client: a phone gets only a scanner capability, never the staff JWT.
export async function deviceRequest<T>(id: string, action: string, token?: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const cancel = () => controller.abort(signal?.reason)
  if (signal?.aborted) cancel()
  else signal?.addEventListener('abort', cancel, { once: true })
  const timeout = setTimeout(() => controller.abort(new Error('PC connection timed out. Retrying…')), 10000)
  try {
    const response = await fetch(`/api/v1/scanner/device/${encodeURIComponent(id)}/${action}`, {
      method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { 'X-Scanner-Token': token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new ScannerRequestError(response.status, data?.message || 'Scanner request failed. Reconnect from the PC.')
    if (data === null) throw new Error('PC returned an invalid response. Retrying…')
    return data as T
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel) }
}

export function phoneOrigin(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Enter the PC’s reachable HTTPS LAN address, for example https://192.168.1.10:5173. Localhost points to the phone itself.')
  }
  return url.origin
}
