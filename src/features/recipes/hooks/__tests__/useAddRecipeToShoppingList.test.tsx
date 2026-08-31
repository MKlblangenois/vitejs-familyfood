import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { shoppingListKeys } from '../../../shopping-lists/hooks/queryKeys'
import { useAddRecipeToShoppingList } from '../index'
import { mockSupabase } from '../../../../test/supabaseMock'
import type { RecipeWithRelations } from '../../types'
import type { ShoppingListWithRelations } from '../../../shopping-lists/types'

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

const recipe: RecipeWithRelations = {
  id: 'r1',
  user_id: 'u1',
  title: 'Pasta',
  description: null,
  image_url: null,
  servings: 4,
  prep_time_minutes: null,
  cook_time_minutes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  recipe_ingredient_groups: [
    {
      id: 'g1',
      recipe_id: 'r1',
      name: 'Sauce',
      position: 0,
      recipe_ingredients: [
        {
          id: 'i1',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Tomato',
          quantity: 2,
          unit: 'cups',
          position: 0,
        },
        {
          id: 'i2',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Garlic',
          quantity: 3,
          unit: 'cloves',
          position: 1,
        },
      ],
    },
  ],
  recipe_steps: [],
}

const list: ShoppingListWithRelations = {
  id: 'sl1',
  owner_id: 'u1',
  title: 'Weekly Groceries',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  shopping_list_members: [],
  shopping_list_items: [
    {
      id: 'existing1',
      list_id: 'sl1',
      name: 'Tomato',
      quantity: 1,
      unit: 'cups',
      checked: false,
      created_by: 'u1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
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
// useAddRecipeToShoppingList
// ===========================================================================

describe('useAddRecipeToShoppingList', () => {
  it('batch-inserts new items and merges duplicates by summing quantities', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i1', 'i2'],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Tomato already exists (1 cup) → merged to 1 + 2 = 3 cups.
    // Garlic is new → inserted.
    expect(chain('shopping_list_items').insert).toHaveBeenCalledWith([
      {
        list_id: 'sl1',
        name: 'Garlic',
        quantity: 3,
        unit: 'cloves',
        checked: false,
        created_by: 'u1',
      },
    ])
    expect(chain('shopping_list_items').update).toHaveBeenCalledWith({
      quantity: 3,
    })
    expect(chain('shopping_list_items').eq).toHaveBeenCalledWith(
      'id',
      'existing1',
    )

    expect(result.current.data).toEqual({ addedCount: 1, mergedCount: 1 })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: shoppingListKeys.detail('sl1'),
    })
  })

  it('scales quantities to the target servings', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    // Scale from 4 servings to 8: Tomato 2 → 4 cups, Garlic 3 → 6 cloves.
    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i1', 'i2'],
      targetServings: 8,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Tomato exists (1 cup) → merged to 1 + 4 = 5 cups.
    expect(chain('shopping_list_items').update).toHaveBeenCalledWith({
      quantity: 5,
    })
    expect(chain('shopping_list_items').insert).toHaveBeenCalledWith([
      {
        list_id: 'sl1',
        name: 'Garlic',
        quantity: 6,
        unit: 'cloves',
        checked: false,
        created_by: 'u1',
      },
    ])
  })

  it('only inserts the selected ingredients', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    // Only select Garlic; Tomato should be ignored.
    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i2'],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('shopping_list_items').insert).toHaveBeenCalledWith([
      {
        list_id: 'sl1',
        name: 'Garlic',
        quantity: 3,
        unit: 'cloves',
        checked: false,
        created_by: 'u1',
      },
    ])
    expect(chain('shopping_list_items').update).not.toHaveBeenCalled()
  })

  it('throws when no ingredients are selected', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: [],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(chain('shopping_list_items').insert).not.toHaveBeenCalled()
  })

  it('throws when the batch insert fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i2'],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('throws when a duplicate update fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    // Insert succeeds, but the update (merge) fails.
    chain('shopping_list_items').setResult({
      data: null,
      error: { message: 'update boom' },
    })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i1', 'i2'],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('throws when the user is not authenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const { chain } = mockSupabase(mocks.from)
    chain('shopping_list_items').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useAddRecipeToShoppingList(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      recipe,
      list,
      selectedIngredientIds: ['i2'],
      targetServings: 4,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // created_by falls back to null when there is no user.
    expect(chain('shopping_list_items').insert).toHaveBeenCalledWith([
      {
        list_id: 'sl1',
        name: 'Garlic',
        quantity: 3,
        unit: 'cloves',
        checked: false,
        created_by: null,
      },
    ])
  })
})
