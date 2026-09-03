const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN as string | undefined

/**
 * Build a Logo.dev URL from a store name.
 * Returns null if no token is configured.
 */
export function getStoreLogoUrl(
  storeName: string,
  size = 128,
): string | null {
  if (!LOGO_DEV_TOKEN) return null
  return `https://img.logo.dev/name/${encodeURIComponent(storeName)}?token=${LOGO_DEV_TOKEN}&size=${size}&retina=true&format=webp`
}

/**
 * Get the first letter of a store name for the fallback avatar.
 */
export function getStoreInitial(storeName: string): string {
  return storeName.charAt(0).toUpperCase()
}

/**
 * Default card colors for stores without a custom color.
 */
export const DEFAULT_CARD_COLORS = [
  '#1f3a2e', // forest
  '#8b5e3c', // brown
  '#c44b2b', // tomato
  '#d4a017', // gold
  '#2563eb', // blue
  '#7c3aed', // purple
  '#059669', // emerald
  '#dc2626', // red
] as const

export function getDefaultCardColor(index: number): string {
  return DEFAULT_CARD_COLORS[index % DEFAULT_CARD_COLORS.length]
}
