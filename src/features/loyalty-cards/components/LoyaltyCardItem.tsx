import { useState } from 'react'
import { getStoreLogoUrl, getStoreInitial } from '../lib/logo'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardItemProps {
  card: LoyaltyCard
  onClick: (card: LoyaltyCard) => void
}

const LoyaltyCardItem = ({ card, onClick }: LoyaltyCardItemProps) => {
  const [logoFailed, setLogoFailed] = useState(false)
  const logoUrl = getStoreLogoUrl(card.store_name, 128)
  const showLogo = logoUrl && !logoFailed

  return (
    <button
      type="button"
      onClick={() => onClick(card)}
      className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-card border border-white/20 shadow-card transition-all duration-200 hover:scale-[1.03] hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:scale-[0.98]"
      style={{ backgroundColor: card.card_color }}
    >
      {/* Logo or fallback initial */}
      {showLogo ? (
        <img
          src={logoUrl}
          alt={`Logo de ${card.store_name}`}
          className="size-16 object-contain transition-transform duration-300 group-hover:scale-110 sm:size-20"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="text-3xl font-bold text-white/90 sm:text-4xl">
          {getStoreInitial(card.store_name)}
        </span>
      )}

      {/* Store name */}
      <span className="mt-3 max-w-[80%] truncate text-xs font-medium text-white/80 sm:text-sm">
        {card.store_name}
      </span>

      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export default LoyaltyCardItem
