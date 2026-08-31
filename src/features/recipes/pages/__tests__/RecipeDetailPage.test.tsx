import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RecipeDetailPage from '../RecipeDetailPage'
import { mockSupabase, createChain } from '../../../../test/supabaseMock'
import type { RecipeWithRelations } from '../../types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: { from: mocks.from },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleRecipe: RecipeWithRelations = {
  id: 'r1',
  user_id: 'u1',
  title: 'Spaghetti Carbonara',
  description: 'A classic Roman pasta',
  image_url: null,
  servings: 4,
  prep_time_minutes: 10,
  cook_time_minutes: 20,
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
          name: 'Eggs',
          quantity: 2,
          unit: 'whole',
          position: 0,
        },
        {
          id: 'i2',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Parmesan',
          quantity: 100,
          unit: 'g',
          position: 1,
        },
      ],
    },
  ],
  recipe_steps: [
    { id: 's1', recipe_id: 'r1', instruction: 'Boil the pasta', position: 0 },
    {
      id: 's2',
      recipe_id: 'r1',
      instruction: 'Mix eggs and cheese',
      position: 1,
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDetailPage(initialPath = '/recipes/r1') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// Tests
// ===========================================================================

describe('RecipeDetailPage', () => {
  it('renders the title, description, servings, ingredients, and steps', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipe, error: null })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', { name: /spaghetti carbonara/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('A classic Roman pasta')).toBeInTheDocument()
    expect(screen.getByText('Servings')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: /ingredients/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Sauce')).toBeInTheDocument()
    expect(screen.getByText('2 whole')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
    expect(screen.getByText('100 g')).toBeInTheDocument()
    expect(screen.getByText('Parmesan')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: /instructions/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Boil the pasta')).toBeInTheDocument()
    expect(screen.getByText('Mix eggs and cheese')).toBeInTheDocument()
  })

  it('scales ingredient quantities when servings change', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipe, error: null })

    renderDetailPage()

    await screen.findByRole('heading', { name: /spaghetti carbonara/i })

    // Base servings (4) → Eggs quantity 2.
    expect(screen.getByText('2 whole')).toBeInTheDocument()

    // Increase to 5 servings → 2 × 5/4 = 2.5 → "2 ½".
    await user.click(screen.getByRole('button', { name: /increase servings/i }))

    expect(screen.getByText('2 ½ whole')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('opens the delete dialog and calls the delete mutation', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipe, error: null })

    renderDetailPage()

    await screen.findByRole('heading', { name: /spaghetti carbonara/i })

    // The fetch already resolved with the recipe; point the chain at a
    // successful delete result before triggering the mutation.
    chain('recipes').setResult({ data: null, error: null })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(
      screen.getByRole('heading', { name: /delete recipe/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete recipe/i }))

    await waitFor(() => {
      expect(chain('recipes').delete).toHaveBeenCalled()
      expect(chain('recipes').eq).toHaveBeenCalledWith('id', 'r1')
    })
  })

  it('shows a loading state while fetching', () => {
    mocks.from.mockReturnValue(createChain({ pending: true }))

    const { container } = renderDetailPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByRole('heading', { name: /spaghetti carbonara/i }),
    ).not.toBeInTheDocument()
  })

  it('shows a not-found state when the recipe does not exist', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: null })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', { name: /recipe not found/i }),
    ).toBeInTheDocument()
  })

  it('shows an error state when the fetch fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: null, error: { message: 'boom' } })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', { name: /couldn't load recipe/i }),
    ).toBeInTheDocument()
  })
})
