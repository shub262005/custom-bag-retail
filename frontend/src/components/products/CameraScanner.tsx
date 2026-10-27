import { useEffect, useRef } from 'react'

export function CameraScanner({ onScan, onError }: { onScan: (code: string) => void; onError: (message: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const callbacks = useRef({ onScan, onError })
  useEffect(() => { callbacks.current = { onScan, onError } })
  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | undefined
    let controls: { stop: () => void } | undefined
    const stop = () => { controls?.stop(); stream?.getTracks().forEach(track => track.stop()) }
    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera scanning needs trusted HTTPS. Open the HTTPS address and trust the local certificate on this phone.')
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } })
        if (cancelled || !video.current) { stop(); return }
        let detected = false
        controls = await new BrowserMultiFormatReader().decodeFromStream(stream, video.current, result => {
          if (!result || detected || cancelled) return
          detected = true
          stop()
          callbacks.current.onScan(result.getText())
        })
        if (cancelled || detected) stop()
      } catch (err) {
        stop()
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        callbacks.current.onError(name === 'NotAllowedError' ? 'Camera permission denied. Allow camera access in your browser and try again.'
          : name === 'NotFoundError' ? 'No camera found. Connect a camera or use the code input.'
          : name === 'NotReadableError' ? 'Camera is busy. Close other camera apps and try again.'
          : err instanceof Error ? err.message : 'Could not start the camera. Try again or enter the code.')
      }
    }
    void start()
    return () => { cancelled = true; stop() }
  }, [])
  return <div className="space-y-2"><video ref={video} autoPlay muted playsInline aria-label="Product scanner camera preview" className="max-h-80 w-full rounded-md bg-black object-contain" /><p className="text-xs text-slate-600">Point at one product label. The camera closes after one scan to prevent repeated additions.</p></div>
}
