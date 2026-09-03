import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BarcodeScannerProps {
  onScan: (decodedText: string, format: string) => void
  onCancel: () => void
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-viewport'

const BarcodeScanner = ({ onScan, onCancel }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner

    const startScanning = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
          },
          (decodedText, result) => {
            if (cancelled) return
            // Extract format from the result
            const format = result?.result?.format?.formatName ?? 'CODE_128'
            onScan(decodedText, format)
          },
          () => {
            // Ignore scan errors (no barcode found in frame)
          },
        )
        if (!cancelled) setIsStarting(false)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Impossible d\'accéder à la caméra.'
        setError(message)
        setIsStarting(false)
      }
    }

    void startScanning()

    return () => {
      cancelled = true
      void cleanup()
    }
  }, [onScan, cleanup])

  return (
    <div className="relative overflow-hidden rounded-card border border-sand-200 bg-black dark:border-white/10">
      {/* Viewport */}
      <div
        id={SCANNER_ELEMENT_ID}
        className="aspect-[4/3] w-full"
      />

      {/* Loading overlay */}
      {isStarting && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-sm text-white">Activation de la caméra…</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
          <div className="text-center">
            <p className="text-sm text-white">{error}</p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 rounded-control bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Annuler le scan"
        className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <XMarkIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}

export default BarcodeScanner
