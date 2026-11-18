import { useEffect } from 'react'

/** Keep the display awake only while the checkout view is visible. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let active = true
    let lock: WakeLockSentinel | null = null
    let requesting = false

    const request = async () => {
      if (
        !active ||
        requesting ||
        lock ||
        document.visibilityState !== 'visible'
      )
        return
      requesting = true
      try {
        const acquired = await navigator.wakeLock.request('screen')
        if (!active || document.visibilityState !== 'visible') {
          await acquired.release()
          return
        }
        lock = acquired
        acquired.addEventListener('release', () => {
          if (lock === acquired) lock = null
        })
      } catch {
        // The API is optional and may be denied (for example, low battery).
      } finally {
        requesting = false
      }
    }
    void request()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (lock) void lock.release()
    }
  }, [enabled])
}
