import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListWithRelations,
} from '../types'
import { shoppingListKeys } from './queryKeys'

// ============================================================
// Realtime payload shape (Supabase postgres_changes)
// ============================================================

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

// ============================================================
// Pure cache-update helpers
//
// These are pure functions: same input → same output, no hidden
// mutation. They return a NEW object when a change applies and the
// original reference when nothing changes, so TanStack Query can
// cheaply skip re-renders for no-op events.
// ============================================================

/**
 * Field-level merge spec for `shopping_list_items` realtime UPDATEs:
 *
 *   name, quantity, unit, checked → last-write-wins (replace with incoming)
 *
 * quantity is NOT summed here. Summing is only for the recipe→list merge
 * (Phase 7.5); realtime sync is a straight last-write-wins replace.
 *
 * Conflict resolution: an UPDATE is only applied when the incoming
 * `updated_at` is strictly newer than the cached item's `updated_at`.
 * This prevents a stale event from clobbering a more recent local edit.
 */
function applyItemUpdate(
  cached: ShoppingListWithRelations | undefined,
  incoming: ShoppingListItem,
): ShoppingListWithRelations | undefined {
  if (!cached) return cached

  const index = cached.shopping_list_items.findIndex(
    (item) => item.id === incoming.id,
  )
  if (index === -1) return cached

  const existing = cached.shopping_list_items[index]
  if (new Date(incoming.updated_at) <= new Date(existing.updated_at)) {
    return cached
  }

  const items = [...cached.shopping_list_items]
  items[index] = incoming
  return { ...cached, shopping_list_items: items }
}

function applyItemInsert(
  cached: ShoppingListWithRelations | undefined,
  incoming: ShoppingListItem,
): ShoppingListWithRelations | undefined {
  if (!cached) return cached
  if (cached.shopping_list_items.some((item) => item.id === incoming.id)) {
    return cached
  }
  return {
    ...cached,
    shopping_list_items: [...cached.shopping_list_items, incoming],
  }
}

function applyItemDelete(
  cached: ShoppingListWithRelations | undefined,
  itemId: string,
): ShoppingListWithRelations | undefined {
  if (!cached) return cached
  if (!cached.shopping_list_items.some((item) => item.id === itemId)) {
    return cached
  }
  return {
    ...cached,
    shopping_list_items: cached.shopping_list_items.filter(
      (item) => item.id !== itemId,
    ),
  }
}

function applyListUpdate(
  cached: ShoppingList[] | undefined,
  incoming: ShoppingList,
): ShoppingList[] | undefined {
  if (!cached) return cached
  if (!cached.some((list) => list.id === incoming.id)) {
    return cached
  }
  return cached.map((list) => (list.id === incoming.id ? incoming : list))
}

function applyListRename(
  cached: ShoppingListWithRelations | undefined,
  incoming: ShoppingList,
): ShoppingListWithRelations | undefined {
  if (!cached) return cached
  return { ...cached, title: incoming.title, updated_at: incoming.updated_at }
}

function applyListDelete(
  cached: ShoppingList[] | undefined,
  listId: string,
): ShoppingList[] | undefined {
  if (!cached) return cached
  if (!cached.some((list) => list.id === listId)) {
    return cached
  }
  return cached.filter((list) => list.id !== listId)
}

// ============================================================
// Event handlers
// ============================================================

function handleItemEvent(queryClient: QueryClient, payload: RealtimePayload) {
  const { eventType, new: newRow, old: oldRow } = payload
  const incoming = newRow as unknown as ShoppingListItem
  const listId = incoming.list_id ?? (oldRow as unknown as ShoppingListItem)?.list_id
  if (!listId) return

  const detailKey = shoppingListKeys.detail(listId)

  if (eventType === 'INSERT') {
    queryClient.setQueryData<ShoppingListWithRelations>(detailKey, (cached) =>
      applyItemInsert(cached, incoming),
    )
    return
  }

  if (eventType === 'UPDATE') {
    queryClient.setQueryData<ShoppingListWithRelations>(detailKey, (cached) =>
      applyItemUpdate(cached, incoming),
    )
    return
  }

  if (eventType === 'DELETE') {
    const deletedId = (oldRow as unknown as ShoppingListItem)?.id ?? incoming.id
    queryClient.setQueryData<ShoppingListWithRelations>(detailKey, (cached) =>
      applyItemDelete(cached, deletedId),
    )
  }
}

function handleListEvent(queryClient: QueryClient, payload: RealtimePayload) {
  const { eventType, new: newRow, old: oldRow } = payload
  const incoming = newRow as unknown as ShoppingList
  const listId = incoming.id ?? (oldRow as unknown as ShoppingList)?.id
  if (!listId) return

  const listsKey = shoppingListKeys.lists()
  const detailKey = shoppingListKeys.detail(listId)

  if (eventType === 'UPDATE') {
    queryClient.setQueryData<ShoppingList[]>(listsKey, (cached) =>
      applyListUpdate(cached, incoming),
    )
    queryClient.setQueryData<ShoppingListWithRelations>(detailKey, (cached) =>
      applyListRename(cached, incoming),
    )
    return
  }

  if (eventType === 'DELETE') {
    queryClient.setQueryData<ShoppingList[]>(listsKey, (cached) =>
      applyListDelete(cached, listId),
    )
    queryClient.removeQueries({ queryKey: detailKey })
  }
}

// ============================================================
// Hook
// ============================================================

/**
 * Subscribe to Supabase Realtime changes for shopping lists and their items,
 * syncing them directly into the TanStack Query cache.
 *
 * - `listId` provided → scope the subscription to that list (detail page).
 * - `listId` omitted → subscribe to all lists/items the user can access
 *   (overview page). RLS scopes realtime delivery to accessible rows.
 *
 * On reconnection (or channel error/timeout/close) the relevant queries are
 * invalidated so the cache refetches fresh full state, reconciling any missed
 * events and any local optimistic state with server state.
 */
export const useRealtimeSync = ({
  listId,
  enabled = true,
}: { listId?: string; enabled?: boolean } = {}) => {
  const queryClient = useQueryClient()
  const hasSubscribed = useRef(false)

  useEffect(() => {
    if (!enabled) return

    // Each new channel's first SUBSCRIBED is a fresh subscription, not a
    // reconnection. Reset so a changed listId or enabled toggle doesn't
    // trigger a spurious invalidation/refetch.
    hasSubscribed.current = false

    const itemsFilter = listId ? `list_id=eq.${listId}` : undefined
    const listsFilter = listId ? `id=eq.${listId}` : undefined

    const channel = supabase
      .channel(`shopping-list-sync-${listId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: itemsFilter,
        },
        (payload) => handleItemEvent(queryClient, payload as RealtimePayload),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: listsFilter,
        },
        (payload) => handleListEvent(queryClient, payload as RealtimePayload),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // A second SUBSCRIBED means the channel reconnected after a drop.
          // Invalidate so the cache refetches and reconciles missed events.
          if (hasSubscribed.current) {
            void queryClient.invalidateQueries({
              queryKey: shoppingListKeys.all,
            })
          }
          hasSubscribed.current = true
          return
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          void queryClient.invalidateQueries({
            queryKey: shoppingListKeys.all,
          })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, listId, enabled])

  return null
}
