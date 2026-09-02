import type { ShoppingListMember } from '../types'

/** French labels for shopping list member roles. */
export const ROLE_LABELS: Record<ShoppingListMember['role'], string> = {
  owner: 'Propriétaire',
  editor: 'Éditeur',
}