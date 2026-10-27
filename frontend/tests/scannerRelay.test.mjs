import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deviceRequest, phoneOrigin, ScannerRequestError } from '../src/features/scanner/scannerApi.ts'
import { dispatchPhoneScan } from '../src/features/scanner/scannerRouting.ts'
import { createSerialPoller } from '../src/features/scanner/serialPoller.ts'

test('phone pairing requires HTTPS and a host reachable from another device', () => {
  assert.equal(phoneOrigin('https://192.168.1.10:5173/ignored/path'), 'https://192.168.1.10:5173')
  for (const origin of ['http://192.168.1.10:5173', 'https://localhost:5173', 'https://127.0.0.1', 'https://[::1]', 'https://user:secret@192.168.1.10']) {
    assert.throws(() => phoneOrigin(origin))
  }
})

test('phone API uses only scanner capability and preserves request ID for retries', async () => {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ id: 'request-1', status: 'PENDING' }), { status: 200 })
  }
  try {
    const scan = { id: 'request-1', code: 'BAG-001', targetId: 'sales-form' }
    await deviceRequest('session-1', 'scans', 'phone-capability', scan)
    await deviceRequest('session-1', 'scans', 'phone-capability', scan)
    assert.equal(calls[0].options.headers['X-Scanner-Token'], 'phone-capability')
    assert.equal(calls[0].options.headers.Authorization, undefined)
    assert.equal(calls[0].options.body, calls[1].options.body)
    assert.equal(JSON.parse(calls[0].options.body).targetId, 'sales-form')
    assert.equal(calls[0].options.cache, 'no-store')
  } finally { globalThis.fetch = original }
})

test('a scan sent before navigation cannot mutate the new destination', () => {
  let purchases = 0
  const purchase = { id: 'purchase-form', disabled: false, onScan: () => { purchases++; return { accepted: true, message: 'Added' } } }
  assert.equal(dispatchPhoneScan({ targetId: 'sales-form', code: 'BAG-001' }, purchase).accepted, false)
  assert.equal(purchases, 0)
  assert.equal(dispatchPhoneScan({ targetId: 'purchase-form', code: 'BAG-001' }, purchase).accepted, true)
  assert.equal(purchases, 1)
})

test('paired phone remains harmless while no form is open or the form is paused', () => {
  const scan = { targetId: 'registration', code: 'NEW-BAG' }
  const onScan = () => { throw new Error('Paused form must not receive scans') }
  assert.equal(dispatchPhoneScan(scan, null).accepted, false)
  assert.equal(dispatchPhoneScan(scan, { id: 'registration', disabled: true, onScan }).accepted, false)
})

test('expired scanner responses retain their status and clear user-facing reason', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Session expired.' }), { status: 410 })
  try {
    await assert.rejects(deviceRequest('old', 'status', 'token'), error => error instanceof ScannerRequestError && error.status === 410 && error.message === 'Session expired.')
  } finally { globalThis.fetch = original }
})

test('phone API times out stalled Wi-Fi requests so the loop can retry', async t => {
  const original = globalThis.fetch
  t.mock.timers.enable({ apis: ['setTimeout'] })
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
  try {
    const pending = deviceRequest('session', 'status', 'token')
    const rejected = assert.rejects(pending, /timed out/)
    t.mock.timers.tick(10000)
    await rejected
  } finally { globalThis.fetch = original }
})

test('phone API preserves HTTP errors even if proxy returns a non-JSON error page', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response('Server unavailable', { status: 503 })
  try {
    await assert.rejects(deviceRequest('session', 'status', 'token'), error => error instanceof ScannerRequestError && error.status === 503)
  } finally { globalThis.fetch = original }
})

test('navigation updates are serialized behind a slow poll and use the latest destination', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let destination = 'sales'
  const calls = []
  let release
  const poller = createSerialPoller(async () => {
    calls.push(destination)
    if (calls.length === 1) await new Promise(resolve => { release = resolve })
  })
  poller.wake()
  destination = 'purchases'; poller.wake()
  destination = 'registration'; poller.wake()
  assert.deepEqual(calls, ['sales'])
  release()
  await Promise.resolve(); await Promise.resolve()
  t.mock.timers.tick(0)
  assert.deepEqual(calls, ['sales', 'registration'])
  poller.stop()
  await Promise.resolve(); await Promise.resolve()
  t.mock.timers.tick(10000)
  assert.equal(calls.length, 2)
})
