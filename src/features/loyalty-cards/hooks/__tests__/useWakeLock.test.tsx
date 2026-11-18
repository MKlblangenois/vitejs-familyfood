import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from '../useWakeLock'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useWakeLock', () => {
  it('requests a lock only in checkout mode and releases it on exit', async () => {
    const release = vi.fn().mockResolvedValue(undefined)
    const request = vi
      .fn()
      .mockResolvedValue({ release, addEventListener: vi.fn() })
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')

    const { rerender, unmount } = renderHook(
      ({ enabled }) => useWakeLock(enabled),
      { initialProps: { enabled: false } },
    )
    expect(request).not.toHaveBeenCalled()
    rerender({ enabled: true })
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    rerender({ enabled: false })
    await waitFor(() => expect(release).toHaveBeenCalledOnce())
    unmount()
  })

  it('releases a lock that resolves after the view closes', async () => {
    const release = vi.fn().mockResolvedValue(undefined)
    let finish: (value: {
      release: typeof release
      addEventListener: ReturnType<typeof vi.fn>
    }) => void = () => {}
    const request = vi.fn(
      () =>
        new Promise<{
          release: typeof release
          addEventListener: ReturnType<typeof vi.fn>
        }>((resolve) => {
          finish = resolve
        }),
    )
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const { unmount } = renderHook(() => useWakeLock(true))
    expect(request).toHaveBeenCalledOnce()
    unmount()
    finish({ release, addEventListener: vi.fn() })
    await waitFor(() => expect(release).toHaveBeenCalledOnce())
  })
})
