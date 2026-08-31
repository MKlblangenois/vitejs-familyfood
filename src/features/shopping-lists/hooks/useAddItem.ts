import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingListItem } from '../types'
import type { CreateItemInput } from '../types'
import { shoppingListKeys } from './queryKeys'

const addItem = async (input: CreateItemInput): Promise<ShoppingListItem> => {
  if (!input.list_id) {
    throw new Error('List id is required to add an item.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      list_id: input.list_id,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add item: ${error.message}`)
  }

  if (!data) {
    throw new Error('Item creation returned no data.')
  }

  return data as ShoppingListItem
}

export const useAddItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
