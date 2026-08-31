import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { shoppingListKeys } from './queryKeys'

interface RemoveMemberInput {
  id: string
  list_id: string
}

const removeMember = async (input: RemoveMemberInput): Promise<void> => {
  if (!input.id) {
    throw new Error('Member id is required to remove a member.')
  }

  const { error } = await supabase
    .from('shopping_list_members')
    .delete()
    .eq('id', input.id)

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`)
  }
}

export const useRemoveMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.list_id),
      })
    },
  })
}
