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

  if (!data) {
    return data as ShoppingListWithRelations
  }

  const list = data as ShoppingListWithRelations

  const memberIds = list.shopping_list_members.map((member) => member.user_id)
  if (memberIds.length === 0) {
    return list
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds)

  if (profilesError) {
    throw new Error(`Failed to load member profiles: ${profilesError.message}`)
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return {
    ...list,
    shopping_list_members: list.shopping_list_members.map((member) => ({
      ...member,
      profile: profileById.get(member.user_id) ?? null,
    })),
  }
}

export const useShoppingList = (id: string) => {
  return useQuery({
    queryKey: shoppingListKeys.detail(id),
    queryFn: () => fetchShoppingList(id),
    enabled: !!id,
  })
}
