import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { Recipe } from '../types'
import type { CreateRecipeInput } from '../types'
import { recipeKeys } from './queryKeys'

/**
 * Create a recipe with its child rows (ingredient groups, ingredients, steps).
 *
 * **Known limitation — no multi-statement transactions:**
 * Supabase JS client does not support multi-statement transactions from the
 * client side. Each `.insert()` call is an independent HTTP request. If a
 * child insert fails after the recipe row has been created, the recipe may
 * be left with partial or no children. On child-insert failure we attempt
 * a best-effort cleanup (delete the orphaned recipe row), but even that
 * cleanup may fail — in which case an orphaned recipe row may persist.
 */
const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  // 0. Get the current authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to create a recipe.')
  }

  // 1. Insert the recipe row with the user foreign key.
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title: input.title,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      servings: input.servings ?? 4,
      prep_time_minutes: input.prep_time_minutes ?? null,
      cook_time_minutes: input.cook_time_minutes ?? null,
      user_id: user.id,
    })
    .select()
    .single()

  if (recipeError) {
    throw new Error(`Failed to create recipe: ${recipeError.message}`)
  }

  if (!recipe) {
    throw new Error('Recipe creation returned no data.')
  }

  const recipeId = recipe.id

  // 2. Batch-insert all ingredient groups in a single round-trip.
  if (input.ingredient_groups.length > 0) {
    const { data: insertedGroups, error: groupsError } = await supabase
      .from('recipe_ingredient_groups')
      .insert(
        input.ingredient_groups.map((group) => ({
          recipe_id: recipeId,
          name: group.name,
          position: group.position,
        })),
      )
      .select('id, name')

    if (groupsError) {
      // Best-effort cleanup: remove the orphaned recipe row.
      await supabase.from('recipes').delete().eq('id', recipeId)
      throw new Error(
        `Failed to create ingredient groups: ${groupsError.message}`,
      )
    }

    if (!insertedGroups) {
      await supabase.from('recipes').delete().eq('id', recipeId)
      throw new Error('Ingredient group creation returned no data.')
    }

    // 3. Batch-insert all ingredients in a single round-trip.
    //    Map each ingredient to its parent group using the returned IDs.
    const allIngredients = input.ingredient_groups.flatMap((group, index) => {
      const groupId = insertedGroups[index]?.id
      if (!groupId) return []
      return group.ingredients.map((ingredient) => ({
        group_id: groupId,
        recipe_id: recipeId,
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
        // Best-effort cleanup: remove the orphaned recipe row.
        await supabase.from('recipes').delete().eq('id', recipeId)
        throw new Error(
          `Failed to create ingredients: ${ingredientsError.message}`,
        )
      }
    }
  }

  // 4. Batch-insert steps in a single round-trip.
  if (input.steps.length > 0) {
    const { error: stepsError } = await supabase.from('recipe_steps').insert(
      input.steps.map((step) => ({
        recipe_id: recipeId,
        instruction: step.instruction,
        position: step.position,
      })),
    )

    if (stepsError) {
      // Best-effort cleanup: remove the orphaned recipe row.
      await supabase.from('recipes').delete().eq('id', recipeId)
      throw new Error(`Failed to create recipe steps: ${stepsError.message}`)
    }
  }

  return recipe as Recipe
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
    },
  })
}
