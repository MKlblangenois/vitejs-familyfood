import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingListWithRelations } from '../types'
import { shoppingListKeys } from './queryKeys'

const fetchShoppingList = async (
  id: string,
): Promise<ShoppingListWithRelations> => {
  if (!id) {
    throw new Error('Shopping list id is required to fetch a shopping list.')
  }

  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*, shopping_list_members(*), shopping_list_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to load shopping list: ${error.message}`)
  }

  return data as ShoppingListWithRelations
}

export const useShoppingList = (id: string) => {
  return useQuery({
    queryKey: shoppingListKeys.detail(id),
    queryFn: () => fetchShoppingList(id),
    enabled: !!id,
  })
}
