import { useEffect, useState } from 'react'
import { SignalSlashIcon } from '@heroicons/react/24/outline'

const NetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md"
    >
      <SignalSlashIcon aria-hidden="true" className="size-4" />
      <span>You&apos;re offline — showing saved content</span>
    </div>
  )
}

export default NetworkStatus
