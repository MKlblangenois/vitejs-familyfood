import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { recipeKeys } from './queryKeys'

const deleteRecipe = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Recipe id is required to delete a recipe.')
  }

  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete recipe: ${error.message}`)
  }
}

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
      void queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(variables),
      })
    },
  })
}
