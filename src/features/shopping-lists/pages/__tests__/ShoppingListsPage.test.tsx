import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ShoppingListsPage from '../ShoppingListsPage'
import { mockSupabase, mockSupabaseRealtime, createChain } from '../../../../test/supabaseMock'
import type { ShoppingList } from '../../types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'u1', email: 'test@example.com' } } },
        error: null,
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getUser: vi.fn(async () => ({
        data: { user: { id: 'u1', email: 'test@example.com' } },
        error: null,
      })),
    },
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleLists: ShoppingList[] = [
  {
    id: 'sl1',
    owner_id: 'u1',
    title: 'Weekly Groceries',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sl2',
    owner_id: 'u2',
    title: 'Party Supplies',
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
      <MemoryRouter initialEntries={['/shopping-lists']}>
        <ShoppingListsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabaseRealtime(mocks.channel)
})

// ===========================================================================
// Tests
// ===========================================================================

describe('ShoppingListsPage', () => {
  it('renders list cards from mocked data', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    renderPage()

    expect(await screen.findByText('Weekly Groceries')).toBeInTheDocument()
    expect(screen.getByText('Party Supplies')).toBeInTheDocument()
  })

  it('shows an empty state when there are no lists', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: [], error: null })

    renderPage()

    expect(
      await screen.findByRole('heading', { name: /aucune liste de courses pour le moment/i }),
    ).toBeInTheDocument()
  })

  it('shows a loading state while fetching', () => {
    mocks.from.mockReturnValue(createChain({ pending: true }))

    const { container } = renderPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText('Weekly Groceries')).not.toBeInTheDocument()
  })

  it('filters lists by search query', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    renderPage()

    await screen.findByText('Weekly Groceries')

    await user.type(screen.getByLabelText('Rechercher des listes de courses'), 'party')

    expect(screen.queryByText('Weekly Groceries')).not.toBeInTheDocument()
    expect(screen.getByText('Party Supplies')).toBeInTheDocument()
  })

  it('opens the create dialog and creates a list', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    // Set up the chain for the create mutation's two inserts
    chain('shopping_lists').setResult({ data: sampleLists, error: null })
    chain('shopping_list_members').setResult({ data: null, error: null })

    renderPage()

    await screen.findByText('Weekly Groceries')

    await user.click(
      screen.getAllByRole('button', { name: /nouvelle liste/i })[0],
    )

    expect(
      screen.getByRole('heading', { name: /nouvelle liste de courses/i }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nom de la liste'), 'Bakery Run')

    await user.click(screen.getByRole('button', { name: /créer la liste/i }))

    await waitFor(() => {
      expect(chain('shopping_lists').insert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Bakery Run' }),
      )
    })
  })

  it('links each list card to its detail page', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    renderPage()

    await screen.findByText('Weekly Groceries')

    expect(
      screen.getByRole('link', { name: /weekly groceries/i }),
    ).toHaveAttribute('href', '/shopping-lists/sl1')
    expect(
      screen.getByRole('link', { name: /party supplies/i }),
    ).toHaveAttribute('href', '/shopping-lists/sl2')
  })

  it('shows the delete confirmation dialog', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    renderPage()

    await screen.findByText('Weekly Groceries')

    // Hover over the card to reveal the delete button
    const card = screen.getByRole('link', { name: /weekly groceries/i })
    await user.hover(card)

    await user.click(
      screen.getByRole('button', { name: /supprimer « weekly groceries »/i }),
    )

    expect(
      screen.getByRole('heading', { name: /supprimer la liste/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/voulez-vous vraiment supprimer/i),
    ).toBeInTheDocument()
  })

  it('shows owner and member badges', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleLists, error: null })

    renderPage()

    await screen.findByText('Weekly Groceries')

    // sl1 is owned by u1 (current user) → "Propriétaire"
    // sl2 is owned by u2 (not current user) → "Membre"
    expect(screen.getByText('Propriétaire')).toBeInTheDocument()
    expect(screen.getByText('Membre')).toBeInTheDocument()
  })
})
