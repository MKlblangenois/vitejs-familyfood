interface BrandMarkProps {
  className?: string
}

/** A vector mark keeps the brand consistent across platforms and fonts. */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 4v40M4 24h40M9.86 9.86l28.28 28.28M38.14 9.86 9.86 38.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
