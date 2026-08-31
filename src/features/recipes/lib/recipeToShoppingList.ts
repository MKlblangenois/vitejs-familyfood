// ============================================================
// Recipe → shopping list conversion — pure, side-effect-free
// helpers for flattening a recipe's ingredients, scaling their
// quantities to a target serving count, and detecting/merging
// duplicates against an existing shopping list.
//
// These functions are shared by the AddToShoppingListModal (for
// the live "added vs merged" summary) and the mutation hook (for
// the actual insert/update payloads), so the summary always
// matches what gets written.
// ============================================================

import { getScaleFactor, scaleQuantity } from './servingScaling'
import type { RecipeWithRelations, RecipeIngredient } from '../types'
import type { ShoppingListItem } from '../../shopping-lists/types'

/** A recipe ingredient with its quantity already scaled to the target servings. */
export interface ScaledIngredient {
  id: string
  name: string
  quantity: number | null
  unit: string | null
}

/** A row to insert into `shopping_list_items`. */
export interface ShoppingListInsert {
  list_id: string
  name: string
  quantity: number | null
  unit: string | null
  checked: boolean
  created_by: string | null
}

/** An existing item whose quantity should be summed with a duplicate. */
export interface ShoppingListUpdate {
  id: string
  quantity: number
}

/** The result of comparing scaled ingredients against an existing list. */
export interface ShoppingListChanges {
  inserts: ShoppingListInsert[]
  updates: ShoppingListUpdate[]
  addedCount: number
  mergedCount: number
}

/**
 * Build a stable key for duplicate detection: lowercase, trimmed, and with
 * whitespace collapsed, combining the name and unit. Two ingredients match
 * when both their normalized name and unit are equal.
 */
export function normalizeItemKey(name: string, unit: string | null): string {
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, ' ')
  const normalizedUnit = (unit ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  return `${normalizedName}::${normalizedUnit}`
}

/**
 * Flatten a recipe's ingredients (which live inside groups) and keep only
 * those whose id is in `selectedIngredientIds`.
 */
export function flattenSelectedIngredients(
  recipe: RecipeWithRelations,
  selectedIngredientIds: string[],
): RecipeIngredient[] {
  const selected = new Set(selectedIngredientIds)
  return recipe.recipe_ingredient_groups.flatMap((group) =>
    group.recipe_ingredients.filter((ingredient) => selected.has(ingredient.id)),
  )
}

/**
 * Scale a list of ingredients from the recipe's base servings to a target
 * serving count. Throws if the servings are invalid (via getScaleFactor).
 */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  recipeServings: number,
  targetServings: number,
): ScaledIngredient[] {
  const factor = getScaleFactor(targetServings, recipeServings)
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    quantity:
      ingredient.quantity !== null
        ? scaleQuantity(ingredient.quantity, factor)
        : null,
    unit: ingredient.unit,
  }))
}

/**
 * Compare scaled ingredients against the items already in a shopping list.
 * Ingredients that match an existing item (by normalized name + unit) become
 * updates that sum their quantities; everything else becomes a new insert.
 */
export function buildShoppingListChanges(
  ingredients: ScaledIngredient[],
  existingItems: ShoppingListItem[],
  listId: string,
  createdBy: string | null,
): ShoppingListChanges {
  const existingByKey = new Map<string, ShoppingListItem>()
  for (const item of existingItems) {
    existingByKey.set(normalizeItemKey(item.name, item.unit), item)
  }

  const inserts: ShoppingListInsert[] = []
  const updateMap = new Map<string, { id: string; quantity: number }>()

  for (const ingredient of ingredients) {
    const key = normalizeItemKey(ingredient.name, ingredient.unit)
    const existing = existingByKey.get(key)
    const incoming = ingredient.quantity ?? 0

    if (existing) {
      const prev = updateMap.get(key)
      if (prev) {
        prev.quantity += incoming
      } else {
        updateMap.set(key, {
          id: existing.id,
          quantity: (existing.quantity ?? 0) + incoming,
        })
      }
    } else {
      inserts.push({
        list_id: listId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        checked: false,
        created_by: createdBy,
      })
    }
  }

  const updates = [...updateMap.values()]

  return {
    inserts,
    updates,
    addedCount: inserts.length,
    mergedCount: updates.length,
  }
}
