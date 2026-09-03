// ============================================================
// Loyalty card feature types — mirrors the Supabase schema exactly.
// ============================================================

import type { Database } from '../../shared/lib/database.types'

// Database row types
export type LoyaltyCardRow = Database['public']['Tables']['loyalty_cards']['Row']
export type LoyaltyCardMemberRow =
  Database['public']['Tables']['loyalty_card_members']['Row']

// ============================================================
// Simplified types for the feature
// ============================================================

/** Row type for the `loyalty_cards` table. */
export interface LoyaltyCard {
  id: string
  user_id: string
  store_name: string
  barcode_value: string | null
  barcode_format: string | null
  card_color: string
  logo_url: string | null
  position: number
  created_at: string
  updated_at: string
}

/** Row type for the `loyalty_card_members` table. */
export interface LoyaltyCardMember {
  id: string
  card_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
  /** Embedded profile (display_name, avatar_url) via the profiles join. */
  profile?: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
}

/**
 * A loyalty card with its nested relations (members).
 * Keys match the PostgREST response, which uses actual table names:
 * `loyalty_card_members`.
 */
export interface LoyaltyCardWithMembers extends LoyaltyCard {
  loyalty_card_members: LoyaltyCardMember[]
}

// ============================================================
// Input types for create / update operations
// ============================================================

/** Payload to create a new loyalty card. */
export interface CreateLoyaltyCardInput {
  store_name: string
  barcode_value?: string | null
  barcode_format?: string | null
  card_color?: string
  logo_url?: string | null
}

/** Payload to update a loyalty card. */
export interface UpdateLoyaltyCardInput {
  id: string
  store_name?: string
  barcode_value?: string | null
  barcode_format?: string | null
  card_color?: string
  logo_url?: string | null
  position?: number
}

/** Payload to add a member to a loyalty card. */
export interface AddCardMemberInput {
  card_id: string
  user_id: string
  role?: 'editor' | 'viewer'
}

// ============================================================
// Barcode format constants
// ============================================================

export const BARCODE_FORMATS = {
  EAN_13: 'EAN_13',
  EAN_8: 'EAN_8',
  CODE_128: 'CODE_128',
  CODE_39: 'CODE_39',
  UPC_A: 'UPC_A',
  UPC_E: 'UPC_E',
  QR_CODE: 'QR_CODE',
} as const

export type BarcodeFormat = (typeof BARCODE_FORMATS)[keyof typeof BARCODE_FORMATS]
