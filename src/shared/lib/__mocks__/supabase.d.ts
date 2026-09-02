// ============================================================
// Type declarations for the Storybook supabase mock
// (`src/shared/lib/__mocks__/supabase.js`).
//
// The mock is a JavaScript file (required by Storybook's module
// mocker), so this `.d.ts` provides the shape that TypeScript
// consumers (`storybookHelpers.tsx`, story files) rely on.
// ============================================================

interface MockChain {
  select: () => MockChain
  order: () => MockChain
  eq: () => MockChain
  insert: () => MockChain
  update: () => MockChain
  delete: () => MockChain
  single: () => MockChain
  then: (
    resolve: (value: { data: unknown; error: unknown }) => void,
    onRejected?: (reason: unknown) => void,
  ) => void
}

interface MockResult {
  data: unknown
  error: unknown
}

declare const supabase: {
  from: (table: string) => MockChain
  auth: {
    getUser: () => Promise<MockResult>
  }
  storage: {
    from: (bucket: string) => {
      upload: () => Promise<MockResult>
      remove: () => Promise<MockResult>
      getPublicUrl: () => MockResult
    }
  }
  channel: (name: string) => {
    on: () => unknown
    subscribe: () => unknown
    unsubscribe: () => void
  }
}

declare const __mockHelpers: {
  /** Set what `.from(table)` queries resolve to. */
  setQueryResult: (table: string, result: MockResult) => void
  /** Set what `.from(table).single()` queries resolve to. */
  setSingleResult: (table: string, result: MockResult) => void
  /** Set what `auth.getUser()` resolves to. */
  setAuthUser: (user: unknown) => void
  /** Make `.from(table)` mutations reject with the given error. */
  setMutationError: (table: string, error: unknown) => void
  /** Reset all mock state between stories. */
  reset: () => void
}

export { supabase, __mockHelpers }
