import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import { loyaltyCardKeys } from './queryKeys'

const deleteLoyaltyCard = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Loyalty card id is required to delete a loyalty card.')
  }

  const { error } = await supabase
    .from('loyalty_cards')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete loyalty card: ${error.message}`)
  }
}

export const useDeleteLoyaltyCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLoyaltyCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyCardKeys.all,
      })
    },
  })
}
