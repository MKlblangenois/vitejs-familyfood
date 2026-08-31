import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { Recipe } from '../types'
import type { UpdateRecipeInput } from '../types'
import { recipeKeys } from './queryKeys'

/**
 * Update a recipe and optionally replace its children (groups, ingredients, steps).
 *
 * **Known limitation — no multi-statement transactions:**
 * Supabase JS client does not support multi-statement transactions from the
 * client side. Each `.delete()` and `.insert()` call is an independent HTTP
 * request. When replacing children, the existing rows are deleted first, then
 * new rows are inserted. If a mid-operation failure occurs (e.g. inserting
 * groups fails after deletion), the recipe may be left with zero children
 * and no automatic rollback. The recipe row itself is always updated
 * successfully before child operations begin.
 */
const updateRecipe = async (input: UpdateRecipeInput): Promise<Recipe> => {
  if (!input.id) {
    throw new Error('Recipe id is required to update a recipe.')
  }

  const { id, ingredient_groups, steps, ...recipeFields } = input

  // 1. Update the recipe row (only provided fields).
  const { data: updatedRecipe, error: recipeError } = await supabase
    .from('recipes')
    .update(recipeFields)
    .eq('id', id)
    .select()
    .single()

  if (recipeError) {
    throw new Error(`Failed to update recipe: ${recipeError.message}`)
  }

  if (!updatedRecipe) {
    throw new Error('Recipe update returned no data.')
  }

  // 2. Replace ingredient groups if provided (delete → re-insert).
  if (ingredient_groups !== undefined) {
    const { error: deleteGroupsError } = await supabase
      .from('recipe_ingredient_groups')
      .delete()
      .eq('recipe_id', id)

    if (deleteGroupsError) {
      throw new Error(
        `Failed to delete existing ingredient groups: ${deleteGroupsError.message}`,
      )
    }

    // Batch-insert all groups in a single round-trip.
    if (ingredient_groups.length > 0) {
      const { data: insertedGroups, error: groupsError } = await supabase
        .from('recipe_ingredient_groups')
        .insert(
          ingredient_groups.map((group) => ({
            recipe_id: id,
            name: group.name,
            position: group.position,
          })),
        )
        .select('id, name')

      if (groupsError) {
        throw new Error(
          `Failed to create ingredient groups: ${groupsError.message}`,
        )
      }

      if (!insertedGroups) {
        throw new Error('Ingredient group creation returned no data.')
      }

      // Batch-insert all ingredients in a single round-trip.
      const allIngredients = ingredient_groups.flatMap((group, index) => {
        const groupId = insertedGroups[index]?.id
        if (!groupId) return []
        return group.ingredients.map((ingredient) => ({
          group_id: groupId,
          recipe_id: id,
          name: ingredient.name,
          quantity: ingredient.quantity ?? null,
          unit: ingredient.unit ?? null,
          position: ingredient.position,
        }))
      })

      if (allIngredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(allIngredients)

        if (ingredientsError) {
          throw new Error(
            `Failed to create ingredients: ${ingredientsError.message}`,
          )
        }
      }
    }
  }

  // 3. Replace steps if provided (delete → re-insert).
  if (steps !== undefined) {
    const { error: deleteStepsError } = await supabase
      .from('recipe_steps')
      .delete()
      .eq('recipe_id', id)

    if (deleteStepsError) {
      throw new Error(
        `Failed to delete existing steps: ${deleteStepsError.message}`,
      )
    }

    if (steps.length > 0) {
      const { error: stepsError } = await supabase.from('recipe_steps').insert(
        steps.map((step) => ({
          recipe_id: id,
          instruction: step.instruction,
          position: step.position,
        })),
      )

      if (stepsError) {
        throw new Error(`Failed to create recipe steps: ${stepsError.message}`)
      }
    }
  }

  return updatedRecipe as Recipe
}

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
      void queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(variables.id),
      })
    },
  })
}
