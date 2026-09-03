import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { LoyaltyCardMember } from '../types'
import type { AddCardMemberInput } from '../types'
import { loyaltyCardKeys } from './queryKeys'

const addCardMember = async (
  input: AddCardMemberInput,
): Promise<LoyaltyCardMember> => {
  if (!input.card_id) {
    throw new Error('Card id is required to add a member.')
  }

  const { data, error } = await supabase
    .from('loyalty_card_members')
    .insert({
      card_id: input.card_id,
      user_id: input.user_id,
      role: input.role ?? 'editor',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add member: ${error.message}`)
  }

  if (!data) {
    throw new Error('Member creation returned no data.')
  }

  return data as LoyaltyCardMember
}

export const useAddCardMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addCardMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyCardKeys.members(variables.card_id),
      })
    },
  })
}
