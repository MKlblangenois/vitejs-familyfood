import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoyaltyCardsPage from '../LoyaltyCardsPage'

const mocks = vi.hoisted(() => ({ useLoyaltyCards: vi.fn(), mutate: vi.fn() }))
vi.mock('../../hooks', () => ({
  useLoyaltyCards: mocks.useLoyaltyCards,
  useCreateLoyaltyCard: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: false,
  }),
}))
vi.mock('../../components/LoyaltyCardBottomSheet', () => ({
  default: ({
    card,
    open,
  }: {
    card: { store_name: string } | null
    open: boolean
  }) => (card && open ? <p>Carte sélectionnée : {card.store_name}</p> : null),
}))
vi.mock('../../components/LoyaltyCardForm', () => ({ default: () => null }))

const cards = [
  { id: '1', store_name: 'Marché du coin', card_color: '#ffffff' },
  { id: '2', store_name: 'Épicerie centrale', card_color: '#1f3a2e' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useLoyaltyCards.mockReturnValue({
    data: cards,
    isLoading: false,
    isError: false,
  })
})

describe('LoyaltyCardsPage', () => {
  it('filters cards without showing the empty-collection state', async () => {
    const user = userEvent.setup()
    render(<LoyaltyCardsPage />)
    await user.type(
      screen.getByLabelText('Rechercher des cartes de fidélité'),
      'introuvable',
    )
    expect(screen.getByText(/aucune carte ne correspond/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: /aucune carte de fidélité pour le moment/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('opens the selected card', async () => {
    const user = userEvent.setup()
    render(<LoyaltyCardsPage />)
    await user.click(screen.getByRole('button', { name: /marché du coin/i }))
    expect(
      screen.getByText('Carte sélectionnée : Marché du coin'),
    ).toBeInTheDocument()
  })

  it('shows the empty state for an empty collection', () => {
    mocks.useLoyaltyCards.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })
    render(<LoyaltyCardsPage />)
    expect(
      screen.getByRole('heading', {
        name: /aucune carte de fidélité pour le moment/i,
      }),
    ).toBeInTheDocument()
  })
})
