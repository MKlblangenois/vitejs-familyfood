import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import App from '../../../App'
import { mockSupabaseRealtime } from '../../../test/supabaseMock'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: { auth: mocks, channel: mocks.channel, removeChannel: mocks.removeChannel },
}))

// Mutable session state that `getSession` reads from. Tests flip this between
// null (unauthenticated) and a session object to simulate sign-in / sign-out.
let currentSession: Record<string, unknown> | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderApp = (initialPath = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
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
  currentSession = null

  mocks.getSession.mockImplementation(async () => ({
    data: { session: currentSession },
  }))
  mocks.onAuthStateChange.mockImplementation((_callback) => {
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
  mocks.signInWithPassword.mockResolvedValue({ error: null })
  mocks.signUp.mockResolvedValue({ error: null })
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
  mocks.updateUser.mockResolvedValue({ error: null })
})

// ===========================================================================
// Tests
// ===========================================================================

describe('Auth System', () => {
  // -----------------------------------------------------------------------
  // 1. Login flow
  // -----------------------------------------------------------------------

  describe('Login Page', () => {
    it('renders the login form with email and password fields', async () => {
      renderApp('/login')

      expect(
        await screen.findByRole('heading', {
          name: /connectez-vous à votre compte/i,
        }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /se connecter/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      await user.click(screen.getByRole('button', { name: /se connecter/i }))

      expect(screen.getByText("L'e-mail est requis")).toBeInTheDocument()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'notanemail')
      await user.type(screen.getByLabelText('Mot de passe'), 'Password1')
      await user.click(screen.getByRole('button', { name: /se connecter/i }))

      expect(
        screen.getByText('Veuillez saisir une adresse e-mail valide'),
      ).toBeInTheDocument()
    })

    it('calls signInWithPassword with entered credentials on submit', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'test@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'Password1')
      await user.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mocks.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password1',
        })
      })
    })

    it('shows friendly error message when signIn fails', async () => {
      const user = userEvent.setup()
      mocks.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      })

      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'test@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /se connecter/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('E-mail ou mot de passe invalide. Veuillez réessayer.')
    })

    it('navigates to / on successful login', async () => {
      const user = userEvent.setup()

      // After sign-in, flip the session so AuthGuard recognises the user.
      mocks.signInWithPassword.mockImplementation(async (creds) => {
        currentSession = {
          user: { id: 'test-user', email: creds.email },
          access_token: 'test-token',
        }
        return { error: null }
      })

      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'test@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'Password1')
      await user.click(screen.getByRole('button', { name: /se connecter/i }))

      expect(
        await screen.findByRole('heading', { name: /recettes/i }),
      ).toBeInTheDocument()
    })

    it('links to register and forgot-password pages', async () => {
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /connectez-vous à votre compte/i,
      })

      expect(
        screen.getByRole('link', { name: /créez-en un maintenant/i }),
      ).toHaveAttribute('href', '/register')
      expect(
        screen.getByRole('link', { name: /mot de passe oublié/i }),
      ).toHaveAttribute('href', '/forgot-password')
    })
  })

  // -----------------------------------------------------------------------
  // 2. Register flow
  // -----------------------------------------------------------------------

  describe('Register Page', () => {
    it('renders the register form with all fields', async () => {
      renderApp('/register')

      expect(
        await screen.findByRole('heading', { name: /créez votre compte/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Nom d’affichage')).toBeInTheDocument()
      expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /créer un compte/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(screen.getByLabelText('Adresse e-mail'), 'chef@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'Password1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password2')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
    })

    it('shows validation error for password shorter than 8 characters', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(screen.getByLabelText('Adresse e-mail'), 'chef@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'Ab1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Ab1')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(
        screen.getByText('Le mot de passe doit contenir au moins 8 caractères'),
      ).toBeInTheDocument()
    })

    it('shows validation error for password missing uppercase letter', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(screen.getByLabelText('Adresse e-mail'), 'chef@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'password1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password1')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(
        screen.getByText(
          'Le mot de passe doit contenir au moins une majuscule',
        ),
      ).toBeInTheDocument()
    })

    it('shows validation error for password missing a number', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(screen.getByLabelText('Adresse e-mail'), 'chef@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'Password')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(
        screen.getByText('Le mot de passe doit contenir au moins un chiffre'),
      ).toBeInTheDocument()
    })

    it('calls signUp with the entered data on submit', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef Wannabe')
      await user.type(
        screen.getByLabelText('Adresse e-mail'),
        'chef@example.com',
      )
      await user.type(screen.getByLabelText('Mot de passe'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      await waitFor(() => {
        expect(mocks.signUp).toHaveBeenCalledWith({
          email: 'chef@example.com',
          password: 'StrongPass1',
          options: { data: { display_name: 'Chef Wannabe' } },
        })
      })
    })

    it('shows friendly error when email is already registered', async () => {
      const user = userEvent.setup()
      mocks.signUp.mockResolvedValue({
        error: { message: 'User already registered' },
      })

      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(
        screen.getByLabelText('Adresse e-mail'),
        'existing@example.com',
      )
      await user.type(screen.getByLabelText('Mot de passe'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Un compte avec cet e-mail existe déjà.')
    })

    it('navigates to / on successful registration', async () => {
      const user = userEvent.setup()

      mocks.signUp.mockImplementation(async (data) => {
        currentSession = {
          user: { id: 'test-user', email: data.email },
          access_token: 'test-token',
        }
        return { error: null }
      })

      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      await user.type(screen.getByLabelText('Nom d’affichage'), 'Chef')
      await user.type(
        screen.getByLabelText('Adresse e-mail'),
        'newuser@example.com',
      )
      await user.type(screen.getByLabelText('Mot de passe'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /créer un compte/i }))

      expect(
        await screen.findByRole('heading', { name: /recettes/i }),
      ).toBeInTheDocument()
    })

    it('links to the login page', async () => {
      renderApp('/register')

      await screen.findByRole('heading', { name: /créez votre compte/i })

      expect(
        screen.getByRole('link', { name: /se connecter/i }),
      ).toHaveAttribute('href', '/login')
    })
  })

  // -----------------------------------------------------------------------
  // 3. Forgot password flow
  // -----------------------------------------------------------------------

  describe('Forgot Password Page', () => {
    it('renders the email form', async () => {
      renderApp('/forgot-password')

      expect(
        await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i }),
      ).toBeInTheDocument()
    })

    it('shows success state after submitting email', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i }))

      expect(
        await screen.findByRole('heading', { name: /vérifiez votre e-mail/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/nous avons envoyé un lien de réinitialisation/i),
      ).toBeInTheDocument()
    })

    it('shows error message when reset fails', async () => {
      const user = userEvent.setup()
      mocks.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Unable to send reset email' },
      })

      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Unable to send reset email')
    })

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i })

      await user.click(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i }))

      expect(screen.getByText("L'e-mail est requis")).toBeInTheDocument()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i })

      await user.type(screen.getByLabelText('Adresse e-mail'), 'notanemail')
      await user.click(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i }))

      expect(
        screen.getByText('Veuillez saisir une adresse e-mail valide'),
      ).toBeInTheDocument()
    })

    it('links back to the login page', async () => {
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /réinitialisez votre mot de passe/i })

      expect(
        screen.getByRole('link', { name: /se connecter/i }),
      ).toHaveAttribute('href', '/login')
    })
  })

  // -----------------------------------------------------------------------
  // 4. Reset password flow
  // -----------------------------------------------------------------------

  describe('Reset Password Page', () => {
    it('renders the new password form', async () => {
      renderApp('/reset-password')

      expect(
        await screen.findByRole('heading', { name: /définir un nouveau mot de passe/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Nouveau mot de passe')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Confirmer le nouveau mot de passe'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /mettre à jour le mot de passe/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /définir un nouveau mot de passe/i })

      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'NewPass2')
      await user.click(screen.getByRole('button', { name: /mettre à jour le mot de passe/i }))

      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
    })

    it('shows success state after updating password', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /définir un nouveau mot de passe/i })

      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'NewPass1')
      await user.click(screen.getByRole('button', { name: /mettre à jour le mot de passe/i }))

      expect(
        await screen.findByRole('heading', { name: /mot de passe mis à jour/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/votre mot de passe a été modifié avec succès/i),
      ).toBeInTheDocument()
    })

    it('shows error message when update fails', async () => {
      const user = userEvent.setup()
      mocks.updateUser.mockResolvedValue({
        error: { message: 'Session expired' },
      })

      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /définir un nouveau mot de passe/i })

      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'NewPass1')
      await user.click(screen.getByRole('button', { name: /mettre à jour le mot de passe/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Session expired')
    })

    it('shows validation error for weak password', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /définir un nouveau mot de passe/i })

      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'short')
      await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'short')
      await user.click(screen.getByRole('button', { name: /mettre à jour le mot de passe/i }))

      expect(
        screen.getByText('Le mot de passe doit contenir au moins 8 caractères'),
      ).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 5. Protected routes (AuthGuard)
  // -----------------------------------------------------------------------

  describe('Protected Routes (AuthGuard)', () => {
    it('redirects unauthenticated users to /login', async () => {
      renderApp('/')

      expect(
        await screen.findByRole('heading', {
          name: /connectez-vous à votre compte/i,
        }),
      ).toBeInTheDocument()
    })

    it('renders protected content when authenticated', async () => {
      mocks.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user', email: 'test@example.com' },
            access_token: 'test-token',
          },
        },
      })

      renderApp('/')

      expect(
        await screen.findByRole('heading', { name: /recettes/i }),
      ).toBeInTheDocument()
    })

    it('redirects to /login when accessing /shopping-lists unauthenticated', async () => {
      renderApp('/shopping-lists')

      expect(
        await screen.findByRole('heading', {
          name: /connectez-vous à votre compte/i,
        }),
      ).toBeInTheDocument()
    })

    it('renders shopping lists when authenticated', async () => {
      mocks.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user', email: 'test@example.com' },
            access_token: 'test-token',
          },
        },
      })

      renderApp('/shopping-lists')

      // The AppShell navigation should be visible for an authenticated user
      expect(
        await screen.findByRole('navigation', { name: /navigation principale/i }),
      ).toBeInTheDocument()
    })
  })
})
