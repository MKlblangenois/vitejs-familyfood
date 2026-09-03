import { Link } from 'react-router-dom'
import {
  QrCodeIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline'
import { getStoreLogoUrl, getStoreInitial } from '../lib/logo'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardItemProps {
  card: LoyaltyCard
}

const LoyaltyCardItem = ({ card }: LoyaltyCardItemProps) => {
  const logoUrl = getStoreLogoUrl(card.store_name, 64)
  const hasBarcode = !!card.barcode_value

  return (
    <Link
      to={`/loyalty-cards/${card.id}`}
      className="group relative overflow-hidden rounded-card border border-white/20 shadow-card transition-all duration-200 hover:scale-[1.02] hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
      style={{ backgroundColor: card.card_color }}
    >
      <div className="relative p-4">
        {/* Logo or fallback initial */}
        <div className="mb-3 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo de ${card.store_name}`}
              className="size-10 shrink-0 rounded-control bg-white/20 object-contain p-1"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const sibling = target.nextElementSibling as HTMLElement | null
                if (sibling) sibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-control bg-white/20 text-lg font-bold text-white ${logoUrl ? 'hidden' : ''}`}
          >
            {getStoreInitial(card.store_name)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {card.store_name}
            </h3>
          </div>
        </div>

        {/* Barcode indicator */}
        {hasBarcode && (
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            {card.barcode_format === 'QR_CODE' ? (
              <QrCodeIcon aria-hidden="true" className="size-3.5" />
            ) : (
              <Bars3BottomLeftIcon aria-hidden="true" className="size-3.5" />
            )}
            <span>{card.barcode_format === 'QR_CODE' ? 'QR Code' : 'Code-barres'}</span>
          </div>
        )}

        {!hasBarcode && (
          <p className="text-xs text-white/50">Aucun code-barres</p>
        )}
      </div>

      {/* Decorative corner gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}

export default LoyaltyCardItem
