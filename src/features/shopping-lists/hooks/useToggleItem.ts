import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingListItem } from '../types'
import { shoppingListKeys } from './queryKeys'

interface ToggleItemInput {
  id: string
  list_id: string
  checked: boolean
}

const toggleItem = async (input: ToggleItemInput): Promise<ShoppingListItem> => {
  if (!input.id) {
    throw new Error('Item id is required to toggle an item.')
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({ checked: input.checked })
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to toggle item: ${error.message}`)
  }

  if (!data) {
    throw new Error('Item toggle returned no data.')
  }

  return data as ShoppingListItem
}

export const useToggleItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
