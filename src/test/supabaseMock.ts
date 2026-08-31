import { vi } from 'vitest'

/**
 * Chainable mock for the Supabase query builder.
 *
 * The real Supabase client returns a chainable builder (`.from().select().eq()…`)
 * whose terminal call resolves to `{ data, error }`. This mock reproduces that
 * shape: every builder method returns the same chain object, and awaiting the
 * chain resolves to a configurable result. Tests set the result per table via
 * `setResult` and assert on the builder method mocks.
 */

export interface Chain {
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  setResult: (result: unknown) => void
  setReject: (reason: unknown) => void
  then: (
    resolve: (value: unknown) => void,
    onRejected?: (reason: unknown) => void,
  ) => void
}

const BUILDER_METHODS = [
  'select',
  'order',
  'eq',
  'insert',
  'update',
  'delete',
  'single',
] as const

/**
 * Build a chainable query-builder mock. When `pending` is true the chain never
 * resolves, which keeps a query in its loading state for testing.
 */
export function createChain({
  pending = false,
}: { pending?: boolean } = {}): Chain {
  let result: unknown = { data: null, error: null }
  let rejectReason: unknown

  const chain = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    setResult: (r: unknown) => {
      result = r
    },
    setReject: (reason: unknown) => {
      rejectReason = reason
    },
    then: (
      resolve: (value: unknown) => void,
      onRejected?: (reason: unknown) => void,
    ) => {
      if (pending) return
      if (rejectReason !== undefined) {
        onRejected?.(rejectReason)
        return
      }
      resolve(result)
    },
  }

  for (const method of BUILDER_METHODS) {
    chain[method].mockReturnValue(chain)
  }

  return chain
}

/**
 * Point `from` at a fresh set of per-table chains and return a lookup helper.
 * Each `.from(table)` call returns the same chain for that table, so tests can
 * configure results and assert on builder calls per table.
 */
export function mockSupabase(from: ReturnType<typeof vi.fn>) {
  const chains = new Map<string, Chain>()

  const getChain = (table: string) => {
    if (!chains.has(table)) chains.set(table, createChain())
    return chains.get(table)!
  }

  from.mockImplementation((table: string) => getChain(table))

  return {
    chain: getChain,
  }
}
