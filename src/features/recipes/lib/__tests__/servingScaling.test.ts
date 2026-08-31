import { describe, it, expect } from 'vitest'
import {
  getScaleFactor,
  scaleQuantity,
  formatQuantity,
} from '../servingScaling'

describe('getScaleFactor', () => {
  it('returns 1 when servings are unchanged', () => {
    expect(getScaleFactor(4, 4)).toBe(1)
  })

  it('returns 2 when doubling servings', () => {
    expect(getScaleFactor(8, 4)).toBe(2)
  })

  it('returns 0.5 when halving servings', () => {
    expect(getScaleFactor(2, 4)).toBe(0.5)
  })

  it('handles non-integer ratios', () => {
    expect(getScaleFactor(3, 4)).toBe(0.75)
  })

  it('throws when base servings is zero', () => {
    expect(() => getScaleFactor(4, 0)).toThrow('Base servings')
  })

  it('throws when base servings is negative', () => {
    expect(() => getScaleFactor(4, -2)).toThrow('Base servings')
  })

  it('throws on non-finite inputs', () => {
    expect(() => getScaleFactor(Number.NaN, 4)).toThrow('finite')
    expect(() => getScaleFactor(4, Number.POSITIVE_INFINITY)).toThrow('finite')
  })
})

describe('scaleQuantity', () => {
  it('scales a whole number', () => {
    expect(scaleQuantity(2, 2)).toBe(4)
  })

  it('scales a decimal', () => {
    expect(scaleQuantity(0.5, 3)).toBe(1.5)
  })

  it('scales by a fractional factor', () => {
    expect(scaleQuantity(3, 0.5)).toBe(1.5)
  })

  it('scales by a factor of 1 (no change)', () => {
    expect(scaleQuantity(2.5, 1)).toBe(2.5)
  })

  it('throws on non-finite inputs', () => {
    expect(() => scaleQuantity(Number.NaN, 2)).toThrow('finite')
    expect(() => scaleQuantity(2, Number.NEGATIVE_INFINITY)).toThrow('finite')
  })
})

describe('formatQuantity', () => {
  it('formats whole numbers', () => {
    expect(formatQuantity(0)).toBe('0')
    expect(formatQuantity(1)).toBe('1')
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(10)).toBe('10')
  })

  it('formats halves', () => {
    expect(formatQuantity(0.5)).toBe('½')
    expect(formatQuantity(1.5)).toBe('1 ½')
    expect(formatQuantity(2.5)).toBe('2 ½')
  })

  it('formats quarters', () => {
    expect(formatQuantity(0.25)).toBe('¼')
    expect(formatQuantity(0.75)).toBe('¾')
    expect(formatQuantity(1.25)).toBe('1 ¼')
    expect(formatQuantity(3.75)).toBe('3 ¾')
  })

  it('formats thirds', () => {
    expect(formatQuantity(1 / 3)).toBe('⅓')
    expect(formatQuantity(2 / 3)).toBe('⅔')
    expect(formatQuantity(1.33)).toBe('1 ⅓')
    expect(formatQuantity(2.67)).toBe('2 ⅔')
  })

  it('formats eighths', () => {
    expect(formatQuantity(0.125)).toBe('⅛')
    expect(formatQuantity(0.375)).toBe('⅜')
    expect(formatQuantity(0.625)).toBe('⅝')
    expect(formatQuantity(0.875)).toBe('⅞')
    expect(formatQuantity(1.125)).toBe('1 ⅛')
    expect(formatQuantity(0.4)).toBe('⅜')
  })

  it('formats mixed numbers', () => {
    expect(formatQuantity(1.5)).toBe('1 ½')
    expect(formatQuantity(2.25)).toBe('2 ¼')
    expect(formatQuantity(3.75)).toBe('3 ¾')
  })

  it('rounds values close to a whole number to the whole', () => {
    expect(formatQuantity(1.98)).toBe('2')
    expect(formatQuantity(0.97)).toBe('1')
    expect(formatQuantity(2.04)).toBe('2')
  })

  it('falls back to one decimal place for unmatched fractions', () => {
    expect(formatQuantity(1.2)).toBe('1.2')
    expect(formatQuantity(1.8)).toBe('1.8')
    expect(formatQuantity(0.55)).toBe('0.6')
  })

  it('formats zero quantity', () => {
    expect(formatQuantity(0)).toBe('0')
  })

  it('formats negative values', () => {
    expect(formatQuantity(-1)).toBe('-1')
    expect(formatQuantity(-0.5)).toBe('-½')
    expect(formatQuantity(-1.5)).toBe('-1 ½')
    expect(formatQuantity(-0.25)).toBe('-¼')
  })

  it('handles very small values', () => {
    expect(formatQuantity(0.001)).toBe('0')
    expect(formatQuantity(0.05)).toBe('0.1')
  })

  it('handles very large values', () => {
    expect(formatQuantity(1000)).toBe('1000')
    expect(formatQuantity(1000.5)).toBe('1000 ½')
  })

  it('throws on non-finite values', () => {
    expect(() => formatQuantity(Number.NaN)).toThrow('finite')
    expect(() => formatQuantity(Number.POSITIVE_INFINITY)).toThrow('finite')
  })
})
