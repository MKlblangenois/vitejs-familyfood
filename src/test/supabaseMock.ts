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
  in: ReturnType<typeof vi.fn>
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
  'in',
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
    in: vi.fn(),
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

// ===========================================================================
// Storage mock
// ===========================================================================

/**
 * A mock of `supabase.storage.from(bucket)` that returns a chainable
 * storage-bucket object with `upload`, `remove`, and `getPublicUrl`.
 *
 * Tests configure results via `setUploadResult`, `setRemoveResult`, and
 * `setPublicUrl`, and assert on the `upload`/`remove`/`getPublicUrl` mocks.
 */
export interface StorageBucketMock {
  upload: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  getPublicUrl: ReturnType<typeof vi.fn>
  setUploadResult: (result: { data: unknown; error: unknown }) => void
  setRemoveResult: (result: { data: unknown; error: unknown }) => void
  setPublicUrl: (url: string) => void
}

export function createStorageBucketMock(): StorageBucketMock {
  let uploadResult: { data: unknown; error: unknown } = {
    data: { path: 'mock-path' },
    error: null,
  }
  let removeResult: { data: unknown; error: unknown } = {
    data: [{ name: 'mock-path' }],
    error: null,
  }
  let publicUrl = 'https://example.com/mock-public-url'

  const bucket = {
    upload: vi.fn(async () => uploadResult),
    remove: vi.fn(async () => removeResult),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl } })),
    setUploadResult: (result: { data: unknown; error: unknown }) => {
      uploadResult = result
    },
    setRemoveResult: (result: { data: unknown; error: unknown }) => {
      removeResult = result
    },
    setPublicUrl: (url: string) => {
      publicUrl = url
    },
  }

  return bucket
}

/**
 * Attach a storage mock to a `supabase` object mock. The `storage.from(bucket)`
 * call returns the same bucket mock for a given bucket name, so tests can
 * configure results and assert on calls per bucket.
 */
export function mockSupabaseStorage(
  storage: { from: ReturnType<typeof vi.fn> },
) {
  const buckets = new Map<string, StorageBucketMock>()

  const getBucket = (bucket: string) => {
    if (!buckets.has(bucket)) buckets.set(bucket, createStorageBucketMock())
    return buckets.get(bucket)!
  }

  storage.from.mockImplementation((bucket: string) => getBucket(bucket))

  return {
    bucket: getBucket,
  }
}

// ===========================================================================
// Realtime mock
// ===========================================================================

/**
 * A mock of `supabase.channel(name)` that reproduces the chainable realtime
 * builder: `.on('postgres_changes', config, callback).subscribe(statusCb)`.
 *
 * Tests register postgres_changes callbacks per table via `handlers`, then
 * drive them with `emit(table, payload)` and drive the subscription status
 * with `setStatus(status)`.
 */
export interface RealtimeChannelMock {
  on: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
  unsubscribe: ReturnType<typeof vi.fn>
  /** postgres_changes callbacks keyed by table name. */
  handlers: Map<string, (payload: unknown) => void>
  /** The status callback passed to `.subscribe()`. */
  statusCallback: ((status: string) => void) | null
  /** Invoke the registered postgres_changes callback for a table. */
  emit: (table: string, payload: unknown) => void
  /** Invoke the subscription status callback. */
  setStatus: (status: string) => void
}

export function createRealtimeChannelMock(): RealtimeChannelMock {
  const handlers = new Map<string, (payload: unknown) => void>()
  let statusCallback: ((status: string) => void) | null = null

  const channel: RealtimeChannelMock = {
    on: vi.fn(
      (
        _event: string,
        config: { table: string },
        callback: (payload: unknown) => void,
      ) => {
        handlers.set(config.table, callback)
        return channel
      },
    ),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      statusCallback = callback ?? null
      return channel
    }),
    unsubscribe: vi.fn(),
    handlers,
    get statusCallback() {
      return statusCallback
    },
    emit: (table: string, payload: unknown) => {
      handlers.get(table)?.(payload)
    },
    setStatus: (status: string) => {
      statusCallback?.(status)
    },
  }

  return channel
}

/**
 * Point `channel` at a fresh set of per-name realtime channel mocks and return
 * a lookup helper. Each `.channel(name)` call returns the same mock for that
 * name, so tests can configure handlers and assert on calls per channel.
 */
export function mockSupabaseRealtime(channel: ReturnType<typeof vi.fn>) {
  const channels = new Map<string, RealtimeChannelMock>()

  const getChannel = (name: string) => {
    if (!channels.has(name)) channels.set(name, createRealtimeChannelMock())
    return channels.get(name)!
  }

  channel.mockImplementation((name: string) => getChannel(name))

  return {
    channel: getChannel,
  }
}
