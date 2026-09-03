import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { loyaltyCardKeys } from './queryKeys'

interface RemoveCardMemberInput {
  card_id: string
  user_id: string
}

const removeCardMember = async (input: RemoveCardMemberInput): Promise<void> => {
  if (!input.card_id || !input.user_id) {
    throw new Error('Card id and user id are required to remove a member.')
  }

  const { error } = await supabase
    .from('loyalty_card_members')
    .delete()
    .eq('card_id', input.card_id)
    .eq('user_id', input.user_id)

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`)
  }
}

export const useRemoveCardMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeCardMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyCardKeys.members(variables.card_id),
      })
    },
  })
}
