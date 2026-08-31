import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { shoppingListKeys } from './queryKeys'

interface DeleteItemInput {
  id: string
  list_id: string
}

const deleteItem = async (input: DeleteItemInput): Promise<void> => {
  if (!input.id) {
    throw new Error('Item id is required to delete an item.')
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', input.id)

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`)
  }
}

export const useDeleteItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
