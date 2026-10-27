// Wake promptly on navigation without issuing a second overlapping poll request.
export function createSerialPoller(task: () => Promise<void>, intervalMs = 900, onError: (error: unknown) => void = () => {}) {
  let stopped = false
  let running = false
  let requested = false
  let timer: ReturnType<typeof setTimeout> | undefined
  async function tick() {
    if (stopped) return
    if (running) { requested = true; return }
    running = true
    try { await task() } catch (error) { onError(error) }
    finally {
      running = false
      if (!stopped) {
        timer = setTimeout(() => void tick(), requested ? 0 : intervalMs)
        requested = false
      }
    }
  }
  return {
    wake() { clearTimeout(timer); void tick() },
    stop() { stopped = true; clearTimeout(timer) },
  }
}
