import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { shoppingListKeys } from './queryKeys'

const deleteShoppingList = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Shopping list id is required to delete a shopping list.')
  }

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete shopping list: ${error.message}`)
  }
}

export const useDeleteShoppingList = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteShoppingList,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables),
      })
    },
  })
}
