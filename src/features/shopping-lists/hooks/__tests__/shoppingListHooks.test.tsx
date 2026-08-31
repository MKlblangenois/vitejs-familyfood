import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { shoppingListKeys } from '../queryKeys'
import {
  useShoppingLists,
  useShoppingList,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
  useAddItem,
  useUpdateItem,
  useDeleteItem,
  useToggleItem,
  useAddMember,
  useRemoveMember,
} from '../index'
import { mockSupabase } from '../../../../test/supabaseMock'
import type {
  ShoppingList,
  ShoppingListWithRelations,
  ShoppingListItem,
  ShoppingListMember,
} from '../../types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const shoppingList: ShoppingList = {
  id: 'sl1',
  owner_id: 'u1',
  title: 'Weekly Groceries',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const member: ShoppingListMember = {
  id: 'm1',
  list_id: 'sl1',
  user_id: 'u1',
  role: 'owner',
  created_at: '2026-01-01T00:00:00Z',
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
  ...shoppingList,
  shopping_list_members: [member],
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

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'u1' } },
    error: null,
  })
})

// ===========================================================================
// shoppingListKeys
// ===========================================================================

describe('shoppingListKeys', () => {
  it('defines the all key', () => {
    expect(shoppingListKeys.all).toEqual(['shoppingLists'])
  })

  it('defines the lists key', () => {
    expect(shoppingListKeys.lists()).toEqual(['shoppingLists', 'list'])
  })

  it('defines the details key', () => {
    expect(shoppingListKeys.details()).toEqual(['shoppingLists', 'detail'])
  })

  it('defines the detail key for a specific id', () => {
    expect(shoppingListKeys.detail('abc')).toEqual([
      'shoppingLists',
      'detail',
      'abc',
    ])
  })
})

// ===========================================================================
// useShoppingLists
// ===========================================================================

describe('useShoppingLists', () => {
  it('fetches all shopping lists', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: [shoppingList],
      error: null,
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useShoppingLists(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([shoppingList])
    expect(chain('shopping_lists').select).toHaveBeenCalledWith('*')
    expect(chain('shopping_lists').order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    })
  })

  it('throws on error', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useShoppingLists(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useShoppingList
// ===========================================================================

describe('useShoppingList', () => {
  it('fetches a single list with members and items', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: listWithRelations,
      error: null,
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useShoppingList('sl1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(listWithRelations)
    expect(chain('shopping_lists').select).toHaveBeenCalledWith(
      '*, shopping_list_members(*), shopping_list_items(*)',
    )
    expect(chain('shopping_lists').eq).toHaveBeenCalledWith('id', 'sl1')
    expect(chain('shopping_lists').single).toHaveBeenCalled()
  })

  it('throws on error', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useShoppingList('sl1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useCreateShoppingList
// ===========================================================================

describe('useCreateShoppingList', () => {
  it('creates a list with owner_id and inserts the owner member', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: shoppingList, error: null })
    chain('shopping_list_members').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Weekly Groceries' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mocks.getUser).toHaveBeenCalled()
    expect(chain('shopping_lists').insert).toHaveBeenCalledWith({
      title: 'Weekly Groceries',
      owner_id: 'u1',
    })
    expect(chain('shopping_list_members').insert).toHaveBeenCalledWith({
      list_id: 'sl1',
      user_id: 'u1',
      role: 'owner',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.all,
    })
  })

  it('throws when the user is not authenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCreateShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Weekly Groceries' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('throws when the list insert fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCreateShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Weekly Groceries' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useUpdateShoppingList
// ===========================================================================

describe('useUpdateShoppingList', () => {
  it('updates the title and invalidates lists + detail', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: { ...shoppingList, title: 'Updated' },
      error: null,
    })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'sl1', title: 'Updated' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_lists').update).toHaveBeenCalledWith({
      title: 'Updated',
    })
    expect(chain('shopping_lists').eq).toHaveBeenCalledWith('id', 'sl1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.lists(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the update fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useUpdateShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'sl1', title: 'Updated' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useDeleteShoppingList
// ===========================================================================

describe('useDeleteShoppingList', () => {
  it('deletes the list and invalidates queries', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('sl1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_lists').delete).toHaveBeenCalled()
    expect(chain('shopping_lists').eq).toHaveBeenCalledWith('id', 'sl1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.lists(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the delete fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useDeleteShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('sl1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useAddItem
// ===========================================================================

describe('useAddItem', () => {
  it('inserts an item with created_by and invalidates the detail query', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: item, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      list_id: 'sl1',
      name: 'Milk',
      quantity: 2,
      unit: 'liters',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mocks.getUser).toHaveBeenCalled()
    expect(chain('shopping_list_items').insert).toHaveBeenCalledWith({
      list_id: 'sl1',
      name: 'Milk',
      quantity: 2,
      unit: 'liters',
      created_by: 'u1',
    })
    expect(chain('shopping_list_items').select).toHaveBeenCalled()
    expect(chain('shopping_list_items').single).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the insert fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ list_id: 'sl1', name: 'Milk' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useUpdateItem
// ===========================================================================

describe('useUpdateItem', () => {
  it('updates the item and invalidates the detail query', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: { ...item, name: 'Oat Milk' },
      error: null,
    })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1', name: 'Oat Milk' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_items').update).toHaveBeenCalledWith({
      name: 'Oat Milk',
    })
    expect(chain('shopping_list_items').eq).toHaveBeenCalledWith('id', 'i1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the update fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useUpdateItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1', name: 'Oat Milk' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useDeleteItem
// ===========================================================================

describe('useDeleteItem', () => {
  it('deletes the item and invalidates the detail query', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_items').delete).toHaveBeenCalled()
    expect(chain('shopping_list_items').eq).toHaveBeenCalledWith('id', 'i1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the delete fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useDeleteItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useToggleItem
// ===========================================================================

describe('useToggleItem', () => {
  it('toggles checked and invalidates the detail query', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: { ...item, checked: true },
      error: null,
    })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useToggleItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1', checked: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_items').update).toHaveBeenCalledWith({
      checked: true,
    })
    expect(chain('shopping_list_items').eq).toHaveBeenCalledWith('id', 'i1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the toggle fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useToggleItem(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'i1', list_id: 'sl1', checked: true })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useAddMember
// ===========================================================================

describe('useAddMember', () => {
  it('inserts a member with role editor and invalidates the detail query', async () => {
    const newMember: ShoppingListMember = {
      id: 'm2',
      list_id: 'sl1',
      user_id: 'u2',
      role: 'editor',
      created_at: '2026-01-01T00:00:00Z',
    }

    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_members').setResult({ data: newMember, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddMember(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ list_id: 'sl1', user_id: 'u2' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_members').insert).toHaveBeenCalledWith({
      list_id: 'sl1',
      user_id: 'u2',
      role: 'editor',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the insert fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_members').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddMember(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ list_id: 'sl1', user_id: 'u2' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ===========================================================================
// useRemoveMember
// ===========================================================================

describe('useRemoveMember', () => {
  it('deletes the member and invalidates the detail query', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_members').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useRemoveMember(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'm1', list_id: 'sl1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_members').delete).toHaveBeenCalled()
    expect(chain('shopping_list_members').eq).toHaveBeenCalledWith('id', 'm1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('throws when the delete fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_members').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useRemoveMember(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'm1', list_id: 'sl1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
