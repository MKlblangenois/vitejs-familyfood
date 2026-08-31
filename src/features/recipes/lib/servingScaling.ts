// ============================================================
// Serving-scaling utilities — pure, side-effect-free helpers for
// scaling ingredient quantities and formatting them for display.
// Reused by the recipe detail page and recipe-to-shopping-list
// conversion (Phase 7).
// ============================================================

/** Common cooking fractions mapped to their Unicode glyphs. */
const FRACTIONS: Record<number, string> = {
  0.125: '⅛',
  0.25: '¼',
  0.375: '⅜',
  0.5: '½',
  0.625: '⅝',
  0.75: '¾',
  0.875: '⅞',
  0.33: '⅓',
  0.67: '⅔',
}

/** How close a fractional part must be to a known fraction to use its glyph. */
const FRACTION_TOLERANCE = 0.05

/**
 * Compute the factor to scale quantities by when moving from `baseServings`
 * to `currentServings`. Throws on non-finite or non-positive base servings.
 */
export function getScaleFactor(
  currentServings: number,
  baseServings: number,
): number {
  if (!Number.isFinite(currentServings) || !Number.isFinite(baseServings)) {
    throw new Error('Servings must be finite numbers')
  }
  if (baseServings <= 0) {
    throw new Error('Base servings must be greater than zero')
  }
  return currentServings / baseServings
}

/**
 * Scale a quantity by a factor. Throws on non-finite inputs.
 */
export function scaleQuantity(quantity: number, factor: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(factor)) {
    throw new Error('Quantity and factor must be finite numbers')
  }
  return quantity * factor
}

/**
 * Format a quantity as a human-readable string with fraction support,
 * e.g. "1", "1½", "¾", "2". Falls back to one decimal place when the
 * fractional part doesn't match a common cooking fraction.
 */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('Quantity must be a finite number')
  }
  if (value === 0) return '0'

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const rounded = Math.round(abs)

  // Values within tolerance of a whole number round to that whole.
  if (Math.abs(abs - rounded) < FRACTION_TOLERANCE) {
    return `${sign}${rounded}`
  }

  const whole = Math.floor(abs)
  const frac = abs - whole

  const closest = Object.keys(FRACTIONS)
    .map(Number)
    .reduce((a, b) =>
      Math.abs(b - frac) < Math.abs(a - frac) ? b : a,
    )

  if (Math.abs(closest - frac) < FRACTION_TOLERANCE) {
    const fraction =
      whole > 0 ? `${whole} ${FRACTIONS[closest]}` : FRACTIONS[closest]
    return `${sign}${fraction}`
  }
  return `${sign}${abs.toFixed(1)}`
}
