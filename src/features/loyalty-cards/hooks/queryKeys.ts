// ============================================================
// Centralized query key factory for the loyalty cards feature.
// Keeping keys in one place ensures cache invalidation stays
// consistent across all hooks.
//
// Hierarchy:
//   loyaltyCards                → all loyalty card queries
//   loyaltyCards list           → list queries only
//   loyaltyCards detail         → all detail queries (if needed)
//   loyaltyCards detail <id>    → single loyalty card by id
//   loyaltyCards members <id>   → members for a specific card
// ============================================================

export const loyaltyCardKeys = {
  /** Matches every loyalty card query (list + individual). */
  all: ['loyaltyCards'] as const,

  /** Matches list queries for loyalty cards. */
  lists: () => [...loyaltyCardKeys.all, 'list'] as const,

  /** Matches all detail queries (useful for broad invalidation). */
  details: () => [...loyaltyCardKeys.all, 'detail'] as const,

  /** Matches the query for a single loyalty card by id. */
  detail: (id: string) => [...loyaltyCardKeys.all, 'detail', id] as const,

  /** Matches the query for members of a specific card. */
  members: (cardId: string) =>
    [...loyaltyCardKeys.all, 'members', cardId] as const,
} as const
