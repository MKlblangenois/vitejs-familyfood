import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { shoppingListKeys } from '../../shopping-lists/hooks/queryKeys'
import type { RecipeWithRelations } from '../types'
import type { ShoppingListWithRelations } from '../../shopping-lists/types'
import {
  flattenSelectedIngredients,
  scaleIngredients,
  buildShoppingListChanges,
} from '../lib/recipeToShoppingList'

// ============================================================
// useAddRecipeToShoppingList — batch-insert a recipe's selected
// ingredients into a shopping list, merging any that already
// exist (matched by normalized name + unit) by summing quantities.
//
// New items are inserted in a single `.insert()` call with multiple
// rows; duplicates update the existing item's quantity. On success
// the target list's detail query is invalidated.
// ============================================================

export interface AddRecipeToShoppingListInput {
  /** The recipe whose ingredients are being added. */
  recipe: RecipeWithRelations
  /** The target shopping list, including its existing items for duplicate detection. */
  list: ShoppingListWithRelations
  /** Ids of the recipe ingredients to add. */
  selectedIngredientIds: string[]
  /** The serving count to scale quantities to. */
  targetServings: number
}

export interface AddRecipeToShoppingListResult {
  addedCount: number
  mergedCount: number
}

const addRecipeToShoppingList = async (
  input: AddRecipeToShoppingListInput,
): Promise<AddRecipeToShoppingListResult> => {
  const { recipe, list, selectedIngredientIds, targetServings } = input

  if (!list.id) {
    throw new Error('A shopping list is required to add recipe ingredients.')
  }
  if (selectedIngredientIds.length === 0) {
    throw new Error('Select at least one ingredient to add.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ingredients = flattenSelectedIngredients(recipe, selectedIngredientIds)
  const scaled = scaleIngredients(ingredients, recipe.servings, targetServings)
  const changes = buildShoppingListChanges(
    scaled,
    list.shopping_list_items,
    list.id,
    user?.id ?? null,
  )

  // Batch-insert all new items in a single call.
  if (changes.inserts.length > 0) {
    const { error } = await supabase
      .from('shopping_list_items')
      .insert(changes.inserts)

    if (error) {
      throw new Error(`Failed to add items: ${error.message}`)
    }
  }

  // Merge duplicates by summing each existing item's quantity.
  for (const update of changes.updates) {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ quantity: update.quantity })
      .eq('id', update.id)

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`)
    }
  }

  return { addedCount: changes.addedCount, mergedCount: changes.mergedCount }
}

export const useAddRecipeToShoppingList = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addRecipeToShoppingList,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list.id),
      })
    },
    onError: (_error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list.id),
      })
    },
  })
}
