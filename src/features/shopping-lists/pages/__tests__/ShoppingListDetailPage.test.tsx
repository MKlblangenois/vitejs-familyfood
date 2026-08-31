import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ShoppingListDetailPage from '../ShoppingListDetailPage'
import { mockSupabase, mockSupabaseRealtime, createChain } from '../../../../test/supabaseMock'
import type { ShoppingListWithRelations } from '../../types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  getUser: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      getUser: mocks.getUser,
    },
  },
}))

const useAuthMock = vi.hoisted(() =>
  vi.fn(() => ({
    user: { id: 'u1', email: 'test@example.com' },
    session: null,
    loading: false,
  })),
)

vi.mock('../../../auth/hooks/useAuth', () => ({
  useAuth: useAuthMock,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleList: ShoppingListWithRelations = {
  id: 'sl1',
  owner_id: 'u1',
  title: 'Weekly Groceries',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  shopping_list_members: [
    {
      id: 'm1',
      list_id: 'sl1',
      user_id: 'u1',
      role: 'owner',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'm2',
      list_id: 'sl1',
      user_id: 'u2',
      role: 'editor',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  shopping_list_items: [
    {
      id: 'i1',
      list_id: 'sl1',
      name: 'Milk',
      quantity: 2,
      unit: 'liters',
      checked: false,
      created_by: 'u1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'i2',
      list_id: 'sl1',
      name: 'Bread',
      quantity: null,
      unit: null,
      checked: true,
      created_by: 'u1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDetailPage(initialPath = '/shopping-lists/sl1') {
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
          <Route
            path="/shopping-lists/:id"
            element={<ShoppingListDetailPage />}
          />
          <Route path="/shopping-lists" element={<div>Shopping Lists</div>} />
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
  mockSupabaseRealtime(mocks.channel)
  useAuthMock.mockReturnValue({
    user: { id: 'u1', email: 'test@example.com' },
    session: null,
    loading: false,
  })
  mocks.getSession.mockResolvedValue({
    data: { session: { user: { id: 'u1', email: 'test@example.com' } } },
    error: null,
  })
  mocks.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'u1', email: 'test@example.com' } },
    error: null,
  })
})

// ===========================================================================
// Tests
// ===========================================================================

describe('ShoppingListDetailPage', () => {
  it('renders the title, items, and members', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', { name: /weekly groceries/i }),
    ).toBeInTheDocument()

    // Items
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('2 liters')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()

    // Member count
    expect(screen.getByText('2 members')).toBeInTheDocument()
  })

  it('adds an item via the form', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    // Mock the addItem mutation chain
    chain('shopping_list_items').setResult({
      data: {
        id: 'i3',
        list_id: 'sl1',
        name: 'Eggs',
        quantity: 12,
        unit: 'pcs',
        checked: false,
        created_by: 'u1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    await user.type(screen.getByLabelText('Item name'), 'Eggs')
    await user.type(screen.getByLabelText('Quantity'), '12')
    await user.type(screen.getByLabelText('Unit'), 'pcs')

    await user.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(chain('shopping_list_items').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          list_id: 'sl1',
          name: 'Eggs',
          quantity: 12,
          unit: 'pcs',
        }),
      )
    })
  })

  it('toggles an item checked state', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    // Mock the toggle mutation chain
    chain('shopping_list_items').setResult({
      data: { ...sampleList.shopping_list_items[0], checked: true },
      error: null,
    })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    await user.click(
      screen.getByRole('button', { name: /check "milk"/i }),
    )

    await waitFor(() => {
      expect(chain('shopping_list_items').update).toHaveBeenCalledWith({
        checked: true,
      })
    })
  })

  it('opens the edit item dialog and saves', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    // Mock the update mutation chain
    chain('shopping_list_items').setResult({
      data: {
        ...sampleList.shopping_list_items[0],
        name: 'Whole Milk',
      },
      error: null,
    })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    await user.click(screen.getByRole('button', { name: /edit "milk"/i }))

    expect(
      screen.getByRole('heading', { name: /edit item/i }),
    ).toBeInTheDocument()

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Whole Milk')

    await user.click(screen.getByRole('button', { name: /save$/i }))

    await waitFor(() => {
      expect(chain('shopping_list_items').update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Whole Milk' }),
      )
    })
  })

  it('opens the delete item confirmation dialog and deletes', async () => {
    const user = userEvent.setup()
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    // Mock the delete mutation chain
    chain('shopping_list_items').setResult({ data: null, error: null })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    await user.click(screen.getByRole('button', { name: /delete "milk"/i }))

    expect(
      screen.getByRole('heading', { name: /delete item/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete item/i }))

    await waitFor(() => {
      expect(chain('shopping_list_items').delete).toHaveBeenCalled()
    })
  })

  it('shows share and delete controls for the owner', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    // Owner badge
    expect(screen.getByText('Owner')).toBeInTheDocument()

    // Share button
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()

    // Delete button
    expect(
      screen.getByRole('button', { name: /delete$/i }),
    ).toBeInTheDocument()
  })

  it('hides share and delete controls for an editor', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u3', email: 'other@example.com' },
      session: null,
      loading: false,
    })

    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: sampleList, error: null })

    renderDetailPage()

    await screen.findByRole('heading', { name: /weekly groceries/i })

    // Editor badge
    expect(screen.getByText('Editor')).toBeInTheDocument()

    // No share button
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()

    // No delete list button
    expect(
      screen.queryByRole('button', { name: /delete$/i }),
    ).not.toBeInTheDocument()
  })

  it('shows a loading state while fetching', () => {
    mocks.from.mockReturnValue(createChain({ pending: true }))

    const { container } = renderDetailPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByRole('heading', { name: /weekly groceries/i }),
    ).not.toBeInTheDocument()
  })

  it('shows an error state when the fetch fails', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({
      data: null,
      error: { message: 'boom' },
    })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', {
        name: /couldn't load shopping list/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows a not-found state when the list does not exist', async () => {
    const { chain } = mockSupabase(mocks.from)
    chain('shopping_lists').setResult({ data: null, error: null })

    renderDetailPage()

    expect(
      await screen.findByRole('heading', { name: /list not found/i }),
    ).toBeInTheDocument()
  })
})
