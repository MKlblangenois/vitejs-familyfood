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
          name: /sign in to your account/i,
        }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /sign in to your account/i,
      })

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /sign in to your account/i,
      })

      await user.type(screen.getByLabelText('Email address'), 'notanemail')
      await user.type(screen.getByLabelText('Password'), 'Password1')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(
        screen.getByText('Please enter a valid email address'),
      ).toBeInTheDocument()
    })

    it('calls signInWithPassword with entered credentials on submit', async () => {
      const user = userEvent.setup()
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /sign in to your account/i,
      })

      await user.type(screen.getByLabelText('Email address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password1')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

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
        name: /sign in to your account/i,
      })

      await user.type(screen.getByLabelText('Email address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Invalid email or password. Please try again.')
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
        name: /sign in to your account/i,
      })

      await user.type(screen.getByLabelText('Email address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password1')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(
        await screen.findByRole('heading', { name: /welcome to tablee/i }),
      ).toBeInTheDocument()
    })

    it('links to register and forgot-password pages', async () => {
      renderApp('/login')

      await screen.findByRole('heading', {
        name: /sign in to your account/i,
      })

      expect(
        screen.getByRole('link', { name: /create one now/i }),
      ).toHaveAttribute('href', '/register')
      expect(
        screen.getByRole('link', { name: /forgot your password/i }),
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
        await screen.findByRole('heading', { name: /create your account/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Display name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create account/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password1')
      await user.type(screen.getByLabelText('Confirm password'), 'Password2')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('shows validation error for password shorter than 8 characters', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com')
      await user.type(screen.getByLabelText('Password'), 'Ab1')
      await user.type(screen.getByLabelText('Confirm password'), 'Ab1')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(
        screen.getByText('Password must be at least 8 characters'),
      ).toBeInTheDocument()
    })

    it('shows validation error for password missing uppercase letter', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com')
      await user.type(screen.getByLabelText('Password'), 'password1')
      await user.type(screen.getByLabelText('Confirm password'), 'password1')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(
        screen.getByText(
          'Password must contain at least one uppercase letter',
        ),
      ).toBeInTheDocument()
    })

    it('shows validation error for password missing a number', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password')
      await user.type(screen.getByLabelText('Confirm password'), 'Password')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(
        screen.getByText('Password must contain at least one number'),
      ).toBeInTheDocument()
    })

    it('calls signUp with the entered data on submit', async () => {
      const user = userEvent.setup()
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef Wannabe')
      await user.type(
        screen.getByLabelText('Email address'),
        'chef@example.com',
      )
      await user.type(screen.getByLabelText('Password'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirm password'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /create account/i }))

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

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(
        screen.getByLabelText('Email address'),
        'existing@example.com',
      )
      await user.type(screen.getByLabelText('Password'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirm password'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('An account with this email already exists.')
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

      await screen.findByRole('heading', { name: /create your account/i })

      await user.type(screen.getByLabelText('Display name'), 'Chef')
      await user.type(
        screen.getByLabelText('Email address'),
        'newuser@example.com',
      )
      await user.type(screen.getByLabelText('Password'), 'StrongPass1')
      await user.type(screen.getByLabelText('Confirm password'), 'StrongPass1')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(
        await screen.findByRole('heading', { name: /welcome to tablee/i }),
      ).toBeInTheDocument()
    })

    it('links to the login page', async () => {
      renderApp('/register')

      await screen.findByRole('heading', { name: /create your account/i })

      expect(
        screen.getByRole('link', { name: /sign in/i }),
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
        await screen.findByRole('heading', { name: /reset your password/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /send reset link/i }),
      ).toBeInTheDocument()
    })

    it('shows success state after submitting email', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /reset your password/i })

      await user.type(screen.getByLabelText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      expect(
        await screen.findByRole('heading', { name: /check your email/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/we've sent a password reset link/i),
      ).toBeInTheDocument()
    })

    it('shows error message when reset fails', async () => {
      const user = userEvent.setup()
      mocks.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Unable to send reset email' },
      })

      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /reset your password/i })

      await user.type(screen.getByLabelText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Unable to send reset email')
    })

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /reset your password/i })

      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /reset your password/i })

      await user.type(screen.getByLabelText('Email address'), 'notanemail')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      expect(
        screen.getByText('Please enter a valid email address'),
      ).toBeInTheDocument()
    })

    it('links back to the login page', async () => {
      renderApp('/forgot-password')

      await screen.findByRole('heading', { name: /reset your password/i })

      expect(
        screen.getByRole('link', { name: /sign in/i }),
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
        await screen.findByRole('heading', { name: /set new password/i }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('New password')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Confirm new password'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /update password/i }),
      ).toBeInTheDocument()
    })

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /set new password/i })

      await user.type(screen.getByLabelText('New password'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirm new password'), 'NewPass2')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('shows success state after updating password', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /set new password/i })

      await user.type(screen.getByLabelText('New password'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirm new password'), 'NewPass1')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(
        await screen.findByRole('heading', { name: /password updated/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/your password has been successfully changed/i),
      ).toBeInTheDocument()
    })

    it('shows error message when update fails', async () => {
      const user = userEvent.setup()
      mocks.updateUser.mockResolvedValue({
        error: { message: 'Session expired' },
      })

      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /set new password/i })

      await user.type(screen.getByLabelText('New password'), 'NewPass1')
      await user.type(screen.getByLabelText('Confirm new password'), 'NewPass1')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(
        await screen.findByRole('alert'),
      ).toHaveTextContent('Session expired')
    })

    it('shows validation error for weak password', async () => {
      const user = userEvent.setup()
      renderApp('/reset-password')

      await screen.findByRole('heading', { name: /set new password/i })

      await user.type(screen.getByLabelText('New password'), 'short')
      await user.type(screen.getByLabelText('Confirm new password'), 'short')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(
        screen.getByText('Password must be at least 8 characters'),
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
          name: /sign in to your account/i,
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
        await screen.findByRole('heading', { name: /welcome to tablee/i }),
      ).toBeInTheDocument()
    })

    it('redirects to /login when accessing /shopping-lists unauthenticated', async () => {
      renderApp('/shopping-lists')

      expect(
        await screen.findByRole('heading', {
          name: /sign in to your account/i,
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
        await screen.findByRole('navigation', { name: /primary/i }),
      ).toBeInTheDocument()
    })
  })
})
