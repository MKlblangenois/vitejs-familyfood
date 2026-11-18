import { useState } from 'react'
import { getStoreLogoUrl, getStoreInitial } from '../lib/logo'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardItemProps {
  card: LoyaltyCard
  onClick: (card: LoyaltyCard) => void
}

const LoyaltyCardItem = ({ card, onClick }: LoyaltyCardItemProps) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null)
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null)
  const logoUrl = getStoreLogoUrl(card.store_name, 128)
  const showLogo = logoUrl && failedLogo !== logoUrl

  return (
    <button
      type="button"
      onClick={() => onClick(card)}
      className="loyalty-card-press group rounded-card border-sand-200/80 shadow-soft focus-visible:outline-forest-600 active:bg-sand-50 dark:bg-forest-900 dark:focus-visible:outline-forest-400 flex min-h-44 min-w-0 flex-col items-start border bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-48 sm:p-5 dark:border-white/10 dark:active:bg-white/10"
    >
      <span
        className="rounded-control bg-sand-50 relative flex size-12 shrink-0 items-center justify-center overflow-hidden sm:size-14"
        aria-hidden="true"
      >
        <span className="font-display text-forest flex size-full items-center justify-center text-xl font-semibold">
          {getStoreInitial(card.store_name)}
        </span>
        {showLogo && (
          <img
            src={logoUrl}
            alt=""
            className={`bg-sand-50 absolute inset-0 size-full object-contain p-1 ${loadedLogo === logoUrl ? '' : 'invisible'}`}
            onLoad={() => setLoadedLogo(logoUrl)}
            onError={() => setFailedLogo(logoUrl)}
          />
        )}
      </span>
      <span className="text-sage-600 dark:text-sage-300 mt-auto block pt-5 text-[10px] font-bold tracking-[0.13em] uppercase">
        Carte de fidélité
      </span>
      <span className="font-display text-ink mt-1 line-clamp-2 w-full text-lg leading-tight font-medium break-words sm:text-xl dark:text-white">
        {card.store_name}
      </span>
      <span
        aria-hidden="true"
        className="mt-3 h-1 w-9 rounded-full"
        style={{ backgroundColor: card.card_color }}
      />
    </button>
  )
}

export default LoyaltyCardItem
