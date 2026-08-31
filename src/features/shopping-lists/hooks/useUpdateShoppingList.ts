import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingList } from '../types'
import type { UpdateShoppingListInput } from '../types'
import { shoppingListKeys } from './queryKeys'

const updateShoppingList = async (
  input: UpdateShoppingListInput,
): Promise<ShoppingList> => {
  if (!input.id) {
    throw new Error('Shopping list id is required to update a shopping list.')
  }

  const { id, ...fields } = input

  const { data: updated, error } = await supabase
    .from('shopping_lists')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update shopping list: ${error.message}`)
  }

  if (!updated) {
    throw new Error('Shopping list update returned no data.')
  }

  return updated as ShoppingList
}

export const useUpdateShoppingList = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateShoppingList,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.id),
      })
    },
  })
}
