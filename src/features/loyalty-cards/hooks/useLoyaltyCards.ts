import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type { LoyaltyCardWithMembers } from '../types'
import { loyaltyCardKeys } from './queryKeys'

const fetchLoyaltyCards = async (): Promise<LoyaltyCardWithMembers[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to view loyalty cards.')
  }

  // Step 1: Get all card IDs where the user is a member
  const { data: memberRows, error: memberError } = await supabase
    .from('loyalty_card_members')
    .select('card_id')
    .eq('user_id', user.id)

  if (memberError) {
    throw new Error(`Failed to load membership data: ${memberError.message}`)
  }

  const memberCardIds = (memberRows ?? []).map((r) => r.card_id)

  // Step 2: Build query with owned cards + shared cards
  // PostgREST can handle: user_id.eq.{userId} OR id.in.{cardIds}
  let query = supabase
    .from('loyalty_cards')
    .select('*, loyalty_card_members(*)')

  if (memberCardIds.length === 0) {
    // No shared cards, just fetch owned cards
    query = query.eq('user_id', user.id)
  } else {
    // Fetch owned cards + cards where user is a member
    query = query.or(`user_id.eq.${user.id},id.in.(${memberCardIds.join(',')})`)
  }

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load loyalty cards: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  const cards = data as LoyaltyCardWithMembers[]

  const allMemberIds = [
    ...new Set(
      cards.flatMap((card) => card.loyalty_card_members.map((m) => m.user_id)),
    ),
  ]

  if (allMemberIds.length === 0) {
    return cards
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', allMemberIds)

  if (profilesError) {
    throw new Error(`Failed to load member profiles: ${profilesError.message}`)
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return cards.map((card) => ({
    ...card,
    loyalty_card_members: card.loyalty_card_members.map((member) => ({
      ...member,
      profile: profileById.get(member.user_id) ?? null,
    })),
  }))
}

export const useLoyaltyCards = () => {
  return useQuery({
    queryKey: loyaltyCardKeys.lists(),
    queryFn: fetchLoyaltyCards,
  })
}
