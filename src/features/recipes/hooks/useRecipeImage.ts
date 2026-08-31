import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { recipeKeys } from './queryKeys'

/**
 * Placeholder hook for recipe image handling.
 *
 * Phase 5 will implement full image upload/download via
 * Supabase Storage. For now this provides a minimal hook
 * that stores an image URL on the recipe row.
 */

const setRecipeImage = async (
  recipeId: string,
  imageUrl: string,
): Promise<void> => {
  if (!recipeId) {
    throw new Error('Recipe id is required to set an image.')
  }

  if (!imageUrl) {
    throw new Error('Image URL is required.')
  }

  const { error } = await supabase
    .from('recipes')
    .update({ image_url: imageUrl })
    .eq('id', recipeId)

  if (error) {
    throw new Error(`Failed to set recipe image: ${error.message}`)
  }
}

export const useRecipeImage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      imageUrl,
    }: {
      recipeId: string
      imageUrl: string
    }) => setRecipeImage(recipeId, imageUrl),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
      void queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(variables.recipeId),
      })
    },
  })
}
