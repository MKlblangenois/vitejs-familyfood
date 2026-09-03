import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { LoyaltyCard } from '../types'
import type { CreateLoyaltyCardInput } from '../types'
import { loyaltyCardKeys } from './queryKeys'

/**
 * Create a loyalty card and insert the creator as the owner member.
 *
 * Supabase JS client does not support multi-statement transactions from the
 * client side. Each `.insert()` call is an independent HTTP request. If the
 * member insert fails after the card has been created, we attempt best-effort
 * cleanup (delete the orphaned card).
 */
const createLoyaltyCard = async (
  input: CreateLoyaltyCardInput,
): Promise<LoyaltyCard> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to create a loyalty card.')
  }

  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .insert({
      store_name: input.store_name,
      barcode_value: input.barcode_value ?? null,
      barcode_format: input.barcode_format ?? null,
      card_color: input.card_color ?? '#4A90D9',
      logo_url: input.logo_url ?? null,
      user_id: user.id,
    })
    .select()
    .single()

  if (cardError) {
    throw new Error(`Failed to create loyalty card: ${cardError.message}`)
  }

  if (!card) {
    throw new Error('Loyalty card creation returned no data.')
  }

  const { error: memberError } = await supabase
    .from('loyalty_card_members')
    .insert({
      card_id: card.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    await supabase.from('loyalty_cards').delete().eq('id', card.id)
    throw new Error(
      `Failed to add owner as member: ${memberError.message}`,
    )
  }

  return card as LoyaltyCard
}

export const useCreateLoyaltyCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLoyaltyCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyCardKeys.all,
      })
    },
  })
}
