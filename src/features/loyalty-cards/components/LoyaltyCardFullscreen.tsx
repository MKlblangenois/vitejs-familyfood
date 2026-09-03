import { useCallback } from 'react'
import {
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { getStoreLogoUrl, getStoreInitial } from '../lib/logo'
import { useWakeLock } from '../hooks'
import BarcodeRenderer from './BarcodeRenderer'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardFullscreenProps {
  card: LoyaltyCard
  onClose: () => void
}

const LoyaltyCardFullscreen = ({ card, onClose }: LoyaltyCardFullscreenProps) => {
  useWakeLock()

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  const logoUrl = getStoreLogoUrl(card.store_name, 128)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-forest-950"
      role="dialog"
      aria-modal="true"
      aria-label={`Carte de fidélité — ${card.store_name}`}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo de ${card.store_name}`}
              className="size-8 shrink-0 rounded-control object-contain"
            />
          ) : (
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-control text-sm font-bold text-white"
              style={{ backgroundColor: card.card_color }}
            >
              {getStoreInitial(card.store_name)}
            </div>
          )}
          <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
            {card.store_name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le mode plein écran"
          className="rounded-control p-2 text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
        >
          <XMarkIcon aria-hidden="true" className="size-6" />
        </button>
      </div>

      {/* Barcode display */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {card.barcode_value && card.barcode_format ? (
          <div className="flex flex-col items-center gap-6">
            <BarcodeRenderer
              value={card.barcode_value}
              format={card.barcode_format}
              className="flex items-center justify-center"
            />
            {card.barcode_format !== 'QR_CODE' && (
              <p className="font-mono text-lg tracking-wider text-ink dark:text-white">
                {card.barcode_value}
              </p>
            )}
          </div>
        ) : (
          <p className="text-ink-400 dark:text-ink-300">
            Aucun code-barres enregistré
          </p>
        )}
      </div>

      {/* Close button at bottom */}
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-control bg-forest px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

export default LoyaltyCardFullscreen
