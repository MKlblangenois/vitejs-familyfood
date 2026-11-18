import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import App from './App'

vi.mock('./features/auth/components/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('./shared/components/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))
vi.mock('./shared/components/DetailDrawer', async () => {
  const React = await import('react')
  const Router = await import('react-router-dom')
  return {
    DetailDrawerContext: React.createContext(false),
    default: function MockDetailDrawer({
      children,
    }: {
      children: React.ReactNode
    }) {
      const navigate = Router.useNavigate()
      return (
        <section role="dialog" aria-label="Fiche">
          <button onClick={() => navigate(-1)}>Fermer</button>
          {children}
        </section>
      )
    },
  }
})
vi.mock('./features/recipes/pages/RecipesPage', () => ({
  default: () => <OpenDetail to="/recipes/r1" label="Recettes" />,
}))
vi.mock('./features/shopping-lists/pages/ShoppingListsPage', () => ({
  default: () => <OpenDetail to="/shopping-lists/l1" label="Listes" />,
}))
vi.mock('./features/recipes/pages/RecipeDetailPage', () => ({
  default: () => <h1>Fiche recette</h1>,
}))
vi.mock('./features/shopping-lists/pages/ShoppingListDetailPage', () => ({
  default: () => <h1>Fiche liste</h1>,
}))

function OpenDetail({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <>
      <h1>{label}</h1>
      <button
        onClick={() =>
          navigate(to, { state: { backgroundLocation: location } })
        }
      >
        Ouvrir
      </button>
    </>
  )
}

describe('detail routes', () => {
  it.each([
    ['/recipes', 'Recettes', 'Fiche recette'],
    ['/shopping-lists', 'Listes', 'Fiche liste'],
  ])(
    'preserves %s behind the detail and returns to it',
    (path, catalogue, detail) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
      expect(screen.getByText(catalogue)).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveTextContent(detail)
      fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText(catalogue)).toBeInTheDocument()
    },
  )

  it.each([
    ['/recipes/r1', 'Fiche recette'],
    ['/shopping-lists/l1', 'Fiche liste'],
  ])('renders a direct link as a full page', (path, detail) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText(detail)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
