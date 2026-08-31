import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import NetworkStatus from '../NetworkStatus'

describe('NetworkStatus', () => {
  const originalOnLine = navigator.onLine

  const setOnline = (online: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: online,
    })
  }

  beforeEach(() => {
    setOnline(true)
  })

  afterEach(() => {
    setOnline(originalOnLine)
    vi.restoreAllMocks()
  })

  it('renders nothing when online', () => {
    render(<NetworkStatus />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the offline banner when the browser goes offline', () => {
    setOnline(false)
    render(<NetworkStatus />)

    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })

  it('clears the banner when the browser comes back online', () => {
    setOnline(false)
    render(<NetworkStatus />)

    expect(screen.getByRole('status')).toBeInTheDocument()

    setOnline(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the banner when an offline event fires', () => {
    render(<NetworkStatus />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })
})
