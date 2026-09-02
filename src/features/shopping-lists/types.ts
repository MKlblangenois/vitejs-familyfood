// ============================================================
// Shopping list feature types — mirrors the Supabase schema exactly.
// ============================================================

/** Row type for the `shopping_lists` table. */
export interface ShoppingList {
  id: string
  owner_id: string
  title: string
  created_at: string
  updated_at: string
}

/** Row type for the `shopping_list_members` table. */
export interface ShoppingListMember {
  id: string
  list_id: string
  user_id: string
  role: 'owner' | 'editor'
  created_at: string
  /** Embedded profile (display_name, avatar_url) via the profiles join. */
  profile?: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
}

/** Row type for the `shopping_list_items` table. */
export interface ShoppingListItem {
  id: string
  list_id: string
  name: string
  quantity: number | null
  unit: string | null
  checked: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * A shopping list with its nested relations (members, items).
 * Keys match the PostgREST response, which uses actual table names:
 * `shopping_list_members` and `shopping_list_items`.
 */
export interface ShoppingListWithRelations extends ShoppingList {
  shopping_list_members: ShoppingListMember[]
  shopping_list_items: ShoppingListItem[]
}

// ============================================================
// Input types for create / update operations
// ============================================================

/** Payload to create a new shopping list. */
export interface CreateShoppingListInput {
  title: string
}

/** Payload to update a shopping list. */
export interface UpdateShoppingListInput {
  id: string
  title?: string
}

/** Payload to create a new shopping list item. */
export interface CreateItemInput {
  list_id: string
  name: string
  quantity?: number | null
  unit?: string | null
}

/** Payload to update a shopping list item. */
export interface UpdateItemInput {
  id: string
  list_id: string
  name?: string
  quantity?: number | null
  unit?: string | null
  checked?: boolean
}

/** Payload to add a member to a shopping list. */
export interface AddMemberInput {
  list_id: string
  user_id: string
}
