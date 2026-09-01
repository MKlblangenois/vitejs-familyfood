import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import RecipesPage from '../RecipesPage'
import { mockSupabase, createChain } from '../../../../test/supabaseMock'
import type { Recipe } from '../../types'

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

const sampleRecipes: Recipe[] = [
  {
    id: 'r1',
    user_id: 'u1',
    title: 'Spaghetti Carbonara',
    description: 'Creamy Roman pasta',
    image_url: null,
    servings: 4,
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'r2',
    user_id: 'u1',
    title: 'Chicken Curry',
    description: 'Warm and spicy',
    image_url: null,
    servings: 6,
    prep_time_minutes: 15,
    cook_time_minutes: 40,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecipesPage />
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

describe('RecipesPage', () => {
  it('renders recipe cards from mocked data', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipes, error: null })

    renderPage()

    expect(
      await screen.findByText('Spaghetti Carbonara'),
    ).toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.getByText('Creamy Roman pasta')).toBeInTheDocument()
    expect(screen.getByText('4 portions')).toBeInTheDocument()
    expect(screen.getByText('30m')).toBeInTheDocument()
  })

  it('shows an empty state when there are no recipes', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: [], error: null })

    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: /aucune recette pour le moment/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows a loading state while fetching', () => {
    mocks.from.mockReturnValue(createChain({ pending: true }))

    const { container } = renderPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument()
  })

  it('filters recipes by search query', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipes, error: null })

    renderPage()

    await screen.findByText('Spaghetti Carbonara')

    await user.type(
      screen.getByLabelText('Rechercher des recettes'),
      'chicken',
    )

    expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
  })

  it('links each recipe card to its detail page', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('recipes').setResult({ data: sampleRecipes, error: null })

    renderPage()

    await screen.findByText('Spaghetti Carbonara')

    expect(
      screen.getByRole('link', { name: /spaghetti carbonara/i }),
    ).toHaveAttribute('href', '/recipes/r1')
    expect(
      screen.getByRole('link', { name: /chicken curry/i }),
    ).toHaveAttribute('href', '/recipes/r2')
  })
})
