import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { LoyaltyCard } from '../types'
import type { UpdateLoyaltyCardInput } from '../types'
import { loyaltyCardKeys } from './queryKeys'

const updateLoyaltyCard = async (
  input: UpdateLoyaltyCardInput,
): Promise<LoyaltyCard> => {
  if (!input.id) {
    throw new Error('Loyalty card id is required to update a loyalty card.')
  }

  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('loyalty_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update loyalty card: ${error.message}`)
  }

  if (!data) {
    throw new Error('Loyalty card update returned no data.')
  }

  return data as LoyaltyCard
}

export const useUpdateLoyaltyCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateLoyaltyCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyCardKeys.all,
      })
    },
  })
}
