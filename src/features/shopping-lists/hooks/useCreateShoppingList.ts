import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingList } from '../types'
import type { CreateShoppingListInput } from '../types'
import { shoppingListKeys } from './queryKeys'

/**
 * Create a shopping list and insert the creator as the owner member.
 *
 * **Known limitation — no multi-statement transactions:**
 * Supabase JS client does not support multi-statement transactions from the
 * client side. Each `.insert()` call is an independent HTTP request. If the
 * member insert fails after the list has been created, we attempt best-effort
 * cleanup (delete the orphaned list), but even that cleanup may fail.
 */
const createShoppingList = async (
  input: CreateShoppingListInput,
): Promise<ShoppingList> => {
  // 0. Get the current authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to create a shopping list.')
  }

  // 1. Insert the shopping list row with the owner foreign key.
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .insert({ title: input.title, owner_id: user.id })
    .select()
    .single()

  if (listError) {
    throw new Error(`Failed to create shopping list: ${listError.message}`)
  }

  if (!list) {
    throw new Error('Shopping list creation returned no data.')
  }

  // 2. Insert the creator as the owner member.
  const { error: memberError } = await supabase
    .from('shopping_list_members')
    .insert({
      list_id: list.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    // Best-effort cleanup: remove the orphaned list row.
    await supabase.from('shopping_lists').delete().eq('id', list.id)
    throw new Error(
      `Failed to add owner as member: ${memberError.message}`,
    )
  }

  return list as ShoppingList
}

export const useCreateShoppingList = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createShoppingList,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.all,
      })
    },
  })
}
