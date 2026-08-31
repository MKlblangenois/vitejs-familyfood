import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRealtimeSync } from '../useRealtimeSync'
import { shoppingListKeys } from '../queryKeys'
import { mockSupabaseRealtime } from '../../../../test/supabaseMock'
import type {
  ShoppingList,
  ShoppingListWithRelations,
  ShoppingListItem,
} from '../../types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: {
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const list: ShoppingList = {
  id: 'sl1',
  owner_id: 'u1',
  title: 'Weekly Groceries',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const item: ShoppingListItem = {
  id: 'i1',
  list_id: 'sl1',
  name: 'Milk',
  quantity: 2,
  unit: 'liters',
  checked: false,
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const listWithRelations: ShoppingListWithRelations = {
  ...list,
  shopping_list_members: [],
  shopping_list_items: [item],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function seedDetail(queryClient: QueryClient, data: ShoppingListWithRelations) {
  queryClient.setQueryData(shoppingListKeys.detail(data.id), data)
}

function seedLists(queryClient: QueryClient, data: ShoppingList[]) {
  queryClient.setQueryData(shoppingListKeys.lists(), data)
}

function itemPayload(
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  row: Partial<ShoppingListItem>,
) {
  return {
    eventType,
    new: eventType === 'DELETE' ? {} : row,
    old: eventType === 'DELETE' ? row : {},
  }
}

function listPayload(
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  row: Partial<ShoppingList>,
) {
  return {
    eventType,
    new: eventType === 'DELETE' ? {} : row,
    old: eventType === 'DELETE' ? row : {},
  }
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// useRealtimeSync
// ===========================================================================

describe('useRealtimeSync', () => {
  it('subscribes to items and lists scoped to the given list id', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const ch = channel('shopping-list-sync-sl1')
    expect(mocks.channel).toHaveBeenCalledWith('shopping-list-sync-sl1')
    expect(ch.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'shopping_list_items',
        filter: 'list_id=eq.sl1',
      }),
      expect.any(Function),
    )
    expect(ch.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'shopping_lists',
        filter: 'id=eq.sl1',
      }),
      expect.any(Function),
    )
    expect(ch.subscribe).toHaveBeenCalled()
  })

  it('subscribes without a filter when no list id is given (overview)', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()

    renderHook(() => useRealtimeSync(), {
      wrapper: createWrapper(queryClient),
    })

    const ch = channel('shopping-list-sync-all')
    expect(ch.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'shopping_list_items',
        filter: undefined,
      }),
      expect.any(Function),
    )
    expect(ch.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'shopping_lists',
        filter: undefined,
      }),
      expect.any(Function),
    )
  })

  it('does not subscribe when disabled', () => {
    mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()

    renderHook(() => useRealtimeSync({ listId: 'sl1', enabled: false }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mocks.channel).not.toHaveBeenCalled()
  })

  it('INSERT adds the item to the cached detail list', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const newItem: ShoppingListItem = {
      ...item,
      id: 'i2',
      name: 'Eggs',
      quantity: 12,
      unit: null,
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('INSERT', newItem),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items).toHaveLength(2)
    expect(cached?.shopping_list_items).toContainEqual(newItem)
  })

  it('UPDATE replaces the item in the cached detail list', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const updated: ShoppingListItem = {
      ...item,
      name: 'Oat Milk',
      quantity: 3,
      updated_at: '2026-01-02T00:00:00Z',
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('UPDATE', updated),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items).toHaveLength(1)
    expect(cached?.shopping_list_items[0]).toEqual(updated)
  })

  it('DELETE removes the item from the cached detail list', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('DELETE', item),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items).toHaveLength(0)
  })

  it('checked toggle arrives as an UPDATE and replaces the item', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const toggled: ShoppingListItem = {
      ...item,
      checked: true,
      updated_at: '2026-01-02T00:00:00Z',
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('UPDATE', toggled),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items[0].checked).toBe(true)
  })

  it('ignores a stale UPDATE with an older updated_at (last-write-wins)', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    // Cached item is newer (updated 2026-01-02).
    const newerItem: ShoppingListItem = {
      ...item,
      name: 'Fresh Milk',
      updated_at: '2026-01-02T00:00:00Z',
    }
    seedDetail(queryClient, {
      ...listWithRelations,
      shopping_list_items: [newerItem],
    })

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    // Incoming event is older (2026-01-01) — must be ignored.
    const stale: ShoppingListItem = {
      ...item,
      name: 'Stale Milk',
      updated_at: '2026-01-01T00:00:00Z',
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('UPDATE', stale),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items[0].name).toBe('Fresh Milk')
  })

  it('ignores an UPDATE with an equal updated_at (strictly newer required)', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const sameTimestamp: ShoppingListItem = {
      ...item,
      name: 'Same Time Milk',
      updated_at: '2026-01-01T00:00:00Z',
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_list_items',
      itemPayload('UPDATE', sameTimestamp),
    )

    const cached = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(cached?.shopping_list_items[0].name).toBe('Milk')
  })

  it('list UPDATE renames the list in both lists and detail queries', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedLists(queryClient, [list])
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const renamed: ShoppingList = {
      ...list,
      title: 'Renamed List',
      updated_at: '2026-01-02T00:00:00Z',
    }
    channel('shopping-list-sync-sl1').emit(
      'shopping_lists',
      listPayload('UPDATE', renamed),
    )

    const lists = queryClient.getQueryData<ShoppingList[]>(
      shoppingListKeys.lists(),
    )
    expect(lists?.[0].title).toBe('Renamed List')

    const detail = queryClient.getQueryData<ShoppingListWithRelations>(
      shoppingListKeys.detail('sl1'),
    )
    expect(detail?.title).toBe('Renamed List')
  })

  it('list DELETE removes the list from the lists query and detail cache', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    seedLists(queryClient, [list])
    seedDetail(queryClient, listWithRelations)

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    channel('shopping-list-sync-sl1').emit(
      'shopping_lists',
      listPayload('DELETE', list),
    )

    const lists = queryClient.getQueryData<ShoppingList[]>(
      shoppingListKeys.lists(),
    )
    expect(lists).toEqual([])
    expect(
      queryClient.getQueryData(shoppingListKeys.detail('sl1')),
    ).toBeUndefined()
  })

  it('invalidates queries on reconnection (second SUBSCRIBED)', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const ch = channel('shopping-list-sync-sl1')
    ch.setStatus('SUBSCRIBED')
    expect(invalidateSpy).not.toHaveBeenCalled()

    ch.setStatus('SUBSCRIBED')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.all,
    })
  })

  it('invalidates queries on channel error', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    channel('shopping-list-sync-sl1').setStatus('CHANNEL_ERROR')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.all,
    })
  })

  it('invalidates queries on timeout', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    channel('shopping-list-sync-sl1').setStatus('TIMED_OUT')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.all,
    })
  })

  it('invalidates queries on channel close', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    channel('shopping-list-sync-sl1').setStatus('CLOSED')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.all,
    })
  })

  it('removes the channel on unmount', () => {
    const { channel } = mockSupabaseRealtime(mocks.channel)
    const queryClient = createQueryClient()

    const { unmount } = renderHook(() => useRealtimeSync({ listId: 'sl1' }), {
      wrapper: createWrapper(queryClient),
    })

    const ch = channel('shopping-list-sync-sl1')
    unmount()

    expect(mocks.removeChannel).toHaveBeenCalledWith(ch)
  })
})
