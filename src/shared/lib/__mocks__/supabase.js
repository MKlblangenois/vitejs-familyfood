// ============================================================
// Storybook mock for `src/shared/lib/supabase.ts`.
//
// This mock is registered via `sb.mock(import('../src/shared/lib/supabase.ts'))`
// in `.storybook/preview.tsx` and replaces the real Supabase client for all
// stories. It reproduces the chainable query-builder shape the hooks expect:
// every builder method returns the same chain object, and awaiting the chain
// resolves to a configurable `{ data, error }` result.
//
// Stories configure behavior via the exported `__mockHelpers`:
//   - `setQueryResult(table, result)`  → what `.from(table)` queries resolve to
//   - `setAuthUser(user)`              → what `auth.getUser()` returns
//   - `setMutationError(table, error)` → makes `.from(table)` mutations reject
// ============================================================

import { fn } from 'storybook/test'

// ---------------------------------------------------------------------------
// Chainable query-builder mock
// ---------------------------------------------------------------------------

const BUILDER_METHODS = [
  'select',
  'order',
  'eq',
  'insert',
  'update',
  'delete',
  'single',
]

function createChain(_table) {
  let result = { data: null, error: null }
  let singleResult
  let rejectReason

  const chain = {
    select: fn(() => chain),
    order: fn(() => chain),
    eq: fn(() => chain),
    insert: fn(() => chain),
    update: fn(() => chain),
    delete: fn(() => chain),
    single: fn(() => {
      singleCalled = true
      return chain
    }),
    then: fn((resolve, onRejected) => {
      if (rejectReason !== undefined) {
        onRejected?.(rejectReason)
        return
      }
      resolve(singleCalled && singleResult !== undefined ? singleResult : result)
    }),
    setResult: (r) => {
      result = r
    },
    setSingleResult: (r) => {
      singleResult = r
    },
    setReject: (reason) => {
      rejectReason = reason
    },
  }

  let singleCalled = false

  for (const method of BUILDER_METHODS) {
    chain[method].mockReturnValue(chain)
  }

  return chain
}

// ---------------------------------------------------------------------------
// Supabase client mock
// ---------------------------------------------------------------------------

const chains = new Map()

const from = fn((table) => {
  if (!chains.has(table)) chains.set(table, createChain(table))
  return chains.get(table)
})

const auth = {
  getUser: fn(async () => ({
    data: { user: { id: 'mock-user' } },
    error: null,
  })),
}

const storage = {
  from: fn(() => ({
    upload: fn(async () => ({ data: { path: 'mock-path' }, error: null })),
    remove: fn(async () => ({ data: [], error: null })),
    getPublicUrl: fn(() => ({
      data: { publicUrl: 'https://example.com/mock-public-url.jpg' },
    })),
  })),
}

const channel = fn(() => ({
  on: fn(() => channel),
  subscribe: fn(() => channel),
  unsubscribe: fn(() => {}),
}))

export const supabase = { from, auth, storage, channel }

// ---------------------------------------------------------------------------
// Story helpers
// ---------------------------------------------------------------------------

export const __mockHelpers = {
  /** Set what `.from(table)` queries resolve to. */
  setQueryResult(table, result) {
    if (!chains.has(table)) chains.set(table, createChain(table))
    chains.get(table).setResult(result)
  },

  /** Set what `.from(table).single()` queries resolve to. */
  setSingleResult(table, result) {
    if (!chains.has(table)) chains.set(table, createChain(table))
    chains.get(table).setSingleResult(result)
  },

  /** Set what `auth.getUser()` resolves to. */
  setAuthUser(user) {
    auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })
  },

  /** Make `.from(table)` mutations reject with the given error. */
  setMutationError(table, error) {
    if (!chains.has(table)) chains.set(table, createChain(table))
    chains.get(table).setReject(error)
  },

  /** Reset all mock state between stories. */
  reset() {
    chains.clear()
    auth.getUser.mockReset()
    auth.getUser.mockResolvedValue({
      data: { user: { id: 'mock-user' } },
      error: null,
    })
    from.mockClear()
    storage.from.mockClear()
    channel.mockClear()
  },
}