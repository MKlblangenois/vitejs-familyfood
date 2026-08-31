// ============================================================
// Centralized query key factory for the shopping lists feature.
// Keeping keys in one place ensures cache invalidation stays
// consistent across all hooks.
//
// Hierarchy:
//   shoppingLists                → all shopping list queries
//   shoppingLists list           → list queries only
//   shoppingLists detail         → all detail queries (if needed)
//   shoppingLists detail <id>    → single shopping list by id
// ============================================================

export const shoppingListKeys = {
  /** Matches every shopping list query (list + individual). */
  all: ['shoppingLists'] as const,

  /** Matches list queries for shopping lists. */
  lists: () => [...shoppingListKeys.all, 'list'] as const,

  /** Matches all detail queries (useful for broad invalidation). */
  details: () => [...shoppingListKeys.all, 'detail'] as const,

  /** Matches the query for a single shopping list by id. */
  detail: (id: string) => [...shoppingListKeys.all, 'detail', id] as const,
} as const
