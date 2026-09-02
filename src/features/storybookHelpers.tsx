// ============================================================
// Shared Storybook helpers for feature-level stories.
//
// Provides a `QueryClientProvider` decorator so hook-using
// components (React Query mutations/queries) render in isolation,
// plus a `resetSupabaseMock` helper to reset the mocked Supabase
// client between stories.
// ============================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { Decorator } from '@storybook/react-vite'
import { __mockHelpers } from '../shared/lib/__mocks__/supabase'

/**
 * Wrap a story in a fresh QueryClientProvider so React Query hooks
 * (useQuery / useMutation) have the context they need.
 */
export const withQueryClient: Decorator = (Story) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

/**
 * Wrap a story in a MemoryRouter so components that use `Link` from
 * react-router-dom render without a full app router.
 */
export const withRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
)

/**
 * Reset the mocked Supabase client to a clean state. Call this in a
 * story's `beforeEach` (or meta-level `beforeEach`) before configuring
 * per-story query results.
 */
export function resetSupabaseMock() {
  __mockHelpers.reset()
}
