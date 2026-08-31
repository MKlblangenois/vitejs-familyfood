import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingListItem } from '../types'
import type { UpdateItemInput } from '../types'
import { shoppingListKeys } from './queryKeys'

const updateItem = async (input: UpdateItemInput): Promise<ShoppingListItem> => {
  if (!input.id) {
    throw new Error('Item id is required to update an item.')
  }

  const { id, list_id: _list_id, ...fields } = input

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update item: ${error.message}`)
  }

  if (!data) {
    throw new Error('Item update returned no data.')
  }

  return data as ShoppingListItem
}

export const useUpdateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
