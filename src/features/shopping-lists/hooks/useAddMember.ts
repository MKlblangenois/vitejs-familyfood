import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { ShoppingListMember } from '../types'
import type { AddMemberInput } from '../types'
import { shoppingListKeys } from './queryKeys'

const addMember = async (input: AddMemberInput): Promise<ShoppingListMember> => {
  if (!input.list_id) {
    throw new Error('List id is required to add a member.')
  }

  const { data, error } = await supabase
    .from('shopping_list_members')
    .insert({
      list_id: input.list_id,
      user_id: input.user_id,
      role: 'editor',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add member: ${error.message}`)
  }

  if (!data) {
    throw new Error('Member creation returned no data.')
  }

  return data as ShoppingListMember
}

export const useAddMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
