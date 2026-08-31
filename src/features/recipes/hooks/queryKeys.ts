// ============================================================
// Centralized query key factory for the recipes feature.
// Keeping keys in one place ensures cache invalidation stays
// consistent across all hooks.
//
// Hierarchy:
//   recipes              → all recipe queries
//   recipes list         → list queries only
//   recipes detail       → all detail queries (if needed)
//   recipes detail <id>  → single recipe by id
// ============================================================

export const recipeKeys = {
  /** Matches every recipe query (list + individual). */
  all: ['recipes'] as const,

  /** Matches list queries for recipes. */
  lists: () => [...recipeKeys.all, 'list'] as const,

  /** Matches all detail queries (useful for broad invalidation). */
  details: () => [...recipeKeys.all, 'detail'] as const,

  /** Matches the query for a single recipe by id. */
  detail: (id: string) => [...recipeKeys.all, 'detail', id] as const,
} as const
