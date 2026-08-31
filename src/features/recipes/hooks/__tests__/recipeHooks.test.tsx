import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { recipeKeys } from '../queryKeys'
import { useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../index'
import { mockSupabase } from '../../../../test/supabaseMock'
import type { Recipe } from '../../types'

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

const recipe: Recipe = {
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
// Tests
// ===========================================================================

describe('recipeKeys', () => {
  it('defines the all key', () => {
    expect(recipeKeys.all).toEqual(['recipes'])
  })

  it('defines the lists key', () => {
    expect(recipeKeys.lists()).toEqual(['recipes', 'list'])
  })

  it('defines the details key', () => {
    expect(recipeKeys.details()).toEqual(['recipes', 'detail'])
  })

  it('defines the detail key for a specific id', () => {
    expect(recipeKeys.detail('abc')).toEqual(['recipes', 'detail', 'abc'])
  })
})

describe('useCreateRecipe', () => {
  it('creates a recipe with its children and invalidates queries on success', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: recipe, error: null })
    chain('recipe_ingredient_groups').setResult({
      data: [{ id: 'g1', name: 'Sauce' }],
      error: null,
    })
    chain('recipe_ingredients').setResult({ data: null, error: null })
    chain('recipe_steps').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      title: 'Pasta',
      ingredient_groups: [
        {
          name: 'Sauce',
          position: 0,
          ingredients: [
            { name: 'Tomato', quantity: 2, unit: 'cups', position: 0 },
          ],
        },
      ],
      steps: [{ instruction: 'Boil water', position: 0 }],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('recipes').insert).toHaveBeenCalledWith({
      title: 'Pasta',
      description: null,
      image_url: null,
      servings: 4,
      prep_time_minutes: null,
      cook_time_minutes: null,
      user_id: 'u1',
    })
    expect(chain('recipes').select).toHaveBeenCalled()
    expect(chain('recipes').single).toHaveBeenCalled()

    expect(chain('recipe_ingredient_groups').insert).toHaveBeenCalledWith([
      { recipe_id: 'r1', name: 'Sauce', position: 0 },
    ])
    expect(chain('recipe_ingredients').insert).toHaveBeenCalledWith([
      {
        group_id: 'g1',
        recipe_id: 'r1',
        name: 'Tomato',
        quantity: 2,
        unit: 'cups',
        position: 0,
      },
    ])
    expect(chain('recipe_steps').insert).toHaveBeenCalledWith([
      { recipe_id: 'r1', instruction: 'Boil water', position: 0 },
    ])

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: recipeKeys.all })
  })

  it('throws when the recipe insert fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: { message: 'boom' } })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCreateRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Pasta', ingredient_groups: [], steps: [] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

describe('useUpdateRecipe', () => {
  it('updates the recipe and replaces children, invalidating queries', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: recipe, error: null })
    chain('recipe_ingredient_groups').setResult({
      data: [{ id: 'g1', name: 'Sauce' }],
      error: null,
    })
    chain('recipe_ingredients').setResult({ data: null, error: null })
    chain('recipe_steps').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      id: 'r1',
      title: 'Pasta v2',
      ingredient_groups: [
        {
          name: 'Sauce',
          position: 0,
          ingredients: [
            { name: 'Tomato', quantity: 3, unit: 'cups', position: 0 },
          ],
        },
      ],
      steps: [{ instruction: 'Boil', position: 0 }],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('recipes').update).toHaveBeenCalledWith({ title: 'Pasta v2' })
    expect(chain('recipes').eq).toHaveBeenCalledWith('id', 'r1')

    expect(chain('recipe_ingredient_groups').delete).toHaveBeenCalled()
    expect(chain('recipe_ingredient_groups').eq).toHaveBeenCalledWith(
      'recipe_id',
      'r1',
    )
    expect(chain('recipe_ingredient_groups').insert).toHaveBeenCalledWith([
      { recipe_id: 'r1', name: 'Sauce', position: 0 },
    ])
    expect(chain('recipe_ingredients').insert).toHaveBeenCalledWith([
      {
        group_id: 'g1',
        recipe_id: 'r1',
        name: 'Tomato',
        quantity: 3,
        unit: 'cups',
        position: 0,
      },
    ])

    expect(chain('recipe_steps').delete).toHaveBeenCalled()
    expect(chain('recipe_steps').eq).toHaveBeenCalledWith('recipe_id', 'r1')
    expect(chain('recipe_steps').insert).toHaveBeenCalledWith([
      { recipe_id: 'r1', instruction: 'Boil', position: 0 },
    ])

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: recipeKeys.all })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: recipeKeys.detail('r1'),
    })
  })

  it('throws when the recipe update fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: { message: 'boom' } })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'r1', title: 'Pasta v2' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

describe('useDeleteRecipe', () => {
  it('deletes the recipe and invalidates queries', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: null })

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('r1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chain('recipes').delete).toHaveBeenCalled()
    expect(chain('recipes').eq).toHaveBeenCalledWith('id', 'r1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: recipeKeys.all })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: recipeKeys.detail('r1'),
    })
  })

  it('throws when the delete fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: { message: 'boom' } })

    const queryClient = createQueryClient()
    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('r1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
