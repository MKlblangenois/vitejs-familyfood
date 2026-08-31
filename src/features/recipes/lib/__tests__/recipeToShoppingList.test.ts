import { describe, it, expect } from 'vitest'
import {
  normalizeItemKey,
  flattenSelectedIngredients,
  scaleIngredients,
  buildShoppingListChanges,
} from '../recipeToShoppingList'
import type { RecipeWithRelations } from '../../types'
import type { ShoppingListItem } from '../../../shopping-lists/types'

const recipe: RecipeWithRelations = {
  id: 'r1',
  user_id: 'u1',
  title: 'Pasta',
  description: null,
  image_url: null,
  servings: 4,
  prep_time_minutes: null,
  cook_time_minutes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  recipe_ingredient_groups: [
    {
      id: 'g1',
      recipe_id: 'r1',
      name: 'Sauce',
      position: 0,
      recipe_ingredients: [
        {
          id: 'i1',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Tomato',
          quantity: 2,
          unit: 'cups',
          position: 0,
        },
        {
          id: 'i2',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Garlic',
          quantity: 3,
          unit: 'cloves',
          position: 1,
        },
      ],
    },
    {
      id: 'g2',
      recipe_id: 'r1',
      name: 'Pasta',
      position: 1,
      recipe_ingredients: [
        {
          id: 'i3',
          group_id: 'g2',
          recipe_id: 'r1',
          name: 'Spaghetti',
          quantity: 500,
          unit: 'g',
          position: 0,
        },
      ],
    },
  ],
  recipe_steps: [],
}

const existingItem = (overrides: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: 'existing1',
  list_id: 'sl1',
  name: 'Tomato',
  quantity: 1,
  unit: 'cups',
  checked: false,
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('normalizeItemKey', () => {
  it('lowercases, trims, and collapses whitespace in name and unit', () => {
    expect(normalizeItemKey('  Tomato  ', '  Cups ')).toBe('tomato::cups')
    expect(normalizeItemKey('Extra   Virgin  Oil', 'ml')).toBe(
      'extra virgin oil::ml',
    )
  })

  it('treats a null unit as an empty string', () => {
    expect(normalizeItemKey('Salt', null)).toBe('salt::')
  })
})

describe('flattenSelectedIngredients', () => {
  it('flattens ingredients across groups and keeps only selected ids', () => {
    const selected = flattenSelectedIngredients(recipe, ['i1', 'i3'])
    expect(selected.map((i) => i.id)).toEqual(['i1', 'i3'])
    expect(selected.map((i) => i.name)).toEqual(['Tomato', 'Spaghetti'])
  })

  it('returns an empty array when nothing is selected', () => {
    expect(flattenSelectedIngredients(recipe, [])).toEqual([])
  })
})

describe('scaleIngredients', () => {
  it('scales quantities by the serving factor', () => {
    const scaled = scaleIngredients(
      flattenSelectedIngredients(recipe, ['i1', 'i2']),
      4,
      8,
    )
    expect(scaled).toEqual([
      { id: 'i1', name: 'Tomato', quantity: 4, unit: 'cups' },
      { id: 'i2', name: 'Garlic', quantity: 6, unit: 'cloves' },
    ])
  })

  it('keeps null quantities as null', () => {
    const scaled = scaleIngredients(
      [{ id: 'i1', group_id: 'g1', recipe_id: 'r1', name: 'Salt', quantity: null, unit: null, position: 0 }],
      4,
      8,
    )
    expect(scaled[0].quantity).toBeNull()
  })

  it('throws on invalid servings', () => {
    expect(() => scaleIngredients([], 0, 8)).toThrow()
  })
})

describe('buildShoppingListChanges', () => {
  it('merges duplicates by summing quantities and inserts new items', () => {
    const changes = buildShoppingListChanges(
      [
        { id: 'i1', name: 'Tomato', quantity: 2, unit: 'cups' },
        { id: 'i2', name: 'Garlic', quantity: 3, unit: 'cloves' },
      ],
      [existingItem({})],
      'sl1',
      'u1',
    )

    expect(changes.addedCount).toBe(1)
    expect(changes.mergedCount).toBe(1)
    expect(changes.updates).toEqual([{ id: 'existing1', quantity: 3 }])
    expect(changes.inserts).toEqual([
      {
        list_id: 'sl1',
        name: 'Garlic',
        quantity: 3,
        unit: 'cloves',
        checked: false,
        created_by: 'u1',
      },
    ])
  })

  it('matches duplicates case-insensitively and ignores whitespace', () => {
    const changes = buildShoppingListChanges(
      [{ id: 'i1', name: '  tomato ', quantity: 2, unit: 'CUPS' }],
      [existingItem({ name: 'Tomato', unit: 'cups' })],
      'sl1',
      'u1',
    )

    expect(changes.mergedCount).toBe(1)
    expect(changes.addedCount).toBe(0)
    expect(changes.updates).toEqual([{ id: 'existing1', quantity: 3 }])
  })

  it('does not merge items with the same name but different units', () => {
    const changes = buildShoppingListChanges(
      [{ id: 'i1', name: 'Tomato', quantity: 2, unit: 'kg' }],
      [existingItem({ unit: 'cups' })],
      'sl1',
      'u1',
    )

    expect(changes.mergedCount).toBe(0)
    expect(changes.addedCount).toBe(1)
  })

  it('treats a null existing quantity as zero when summing', () => {
    const changes = buildShoppingListChanges(
      [{ id: 'i1', name: 'Tomato', quantity: 2, unit: 'cups' }],
      [existingItem({ quantity: null })],
      'sl1',
      'u1',
    )

    expect(changes.updates).toEqual([{ id: 'existing1', quantity: 2 }])
  })

  it('treats a null incoming quantity as zero when summing', () => {
    const changes = buildShoppingListChanges(
      [{ id: 'i1', name: 'Tomato', quantity: null, unit: 'cups' }],
      [existingItem({ quantity: 1 })],
      'sl1',
      'u1',
    )

    expect(changes.updates).toEqual([{ id: 'existing1', quantity: 1 }])
  })

  it('deduplicates incoming ingredients with the same normalized key', () => {
    const changes = buildShoppingListChanges(
      [
        { id: 'i1', name: 'Tomato', quantity: 2, unit: 'cups' },
        { id: 'i2', name: 'tomato', quantity: 3, unit: 'Cups' },
      ],
      [existingItem({ quantity: 1 })],
      'sl1',
      'u1',
    )

    // Both incoming ingredients normalize to the same key. The existing
    // quantity (1) plus both incoming (2 + 3) should produce a single
    // update with quantity 6.
    expect(changes.addedCount).toBe(0)
    expect(changes.mergedCount).toBe(1)
    expect(changes.updates).toEqual([{ id: 'existing1', quantity: 6 }])
  })
})
