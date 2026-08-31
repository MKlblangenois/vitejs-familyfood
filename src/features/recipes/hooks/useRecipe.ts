import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { RecipeWithRelations } from '../types'
import { recipeKeys } from './queryKeys'

const fetchRecipe = async (id: string): Promise<RecipeWithRelations> => {
  if (!id) {
    throw new Error('Recipe id is required to fetch a recipe.')
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredient_groups(*, recipe_ingredients(*)), recipe_steps(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to load recipe: ${error.message}`)
  }

  return data as RecipeWithRelations
}

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  })
}
