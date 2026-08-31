import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingList } from '../types'
import { shoppingListKeys } from './queryKeys'

const fetchShoppingLists = async (): Promise<ShoppingList[]> => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load shopping lists: ${error.message}`)
  }

  return data as ShoppingList[]
}

/**
 * Fetch all shopping lists the current user owns OR is a member of.
 *
 * The RLS model defines two SELECT policies on `shopping_lists`:
 *   1. `shopping_lists_select_owner` — owner_id = auth.uid()
 *   2. `shopping_lists_select_member` — user exists in shopping_list_members
 *
 * PostgREST ORs these policies, so a simple `.select('*')` returns both.
 */
export const useShoppingLists = () => {
  return useQuery({
    queryKey: shoppingListKeys.lists(),
    queryFn: fetchShoppingLists,
  })
}
