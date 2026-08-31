import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { Recipe } from '../types'
import { recipeKeys } from './queryKeys'

const fetchRecipes = async (): Promise<Recipe[]> => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load recipes: ${error.message}`)
  }

  return data as Recipe[]
}

export const useRecipes = () => {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: fetchRecipes,
  })
}
