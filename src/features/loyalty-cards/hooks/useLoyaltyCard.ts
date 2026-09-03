import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { LoyaltyCardWithMembers } from '../types'
import { loyaltyCardKeys } from './queryKeys'

const fetchLoyaltyCard = async (
  id: string,
): Promise<LoyaltyCardWithMembers> => {
  if (!id) {
    throw new Error('Loyalty card id is required to fetch a loyalty card.')
  }

  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*, loyalty_card_members(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to load loyalty card: ${error.message}`)
  }

  if (!data) {
    throw new Error('Loyalty card not found.')
  }

  const card = data as LoyaltyCardWithMembers

  const memberIds = card.loyalty_card_members.map((member) => member.user_id)
  if (memberIds.length === 0) {
    return card
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
    ...card,
    loyalty_card_members: card.loyalty_card_members.map((member) => ({
      ...member,
      profile: profileById.get(member.user_id) ?? null,
    })),
  }
}

export const useLoyaltyCard = (id: string) => {
  return useQuery({
    queryKey: loyaltyCardKeys.detail(id),
    queryFn: () => fetchLoyaltyCard(id),
    enabled: !!id,
  })
}
