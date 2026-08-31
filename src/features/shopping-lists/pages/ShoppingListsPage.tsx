import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useShoppingLists,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
} from '../hooks'

// ============================================================
// Sub-components
// ============================================================

function ListCard({
  list,
  currentUserId,
  onRename,
  onDelete,
}: {
  list: { id: string; title: string; owner_id: string; created_at: string; updated_at: string }
  currentUserId: string
  onRename: (list: { id: string; title: string }) => void
  onDelete: (list: { id: string; title: string }) => void
}) {
  const isOwner = list.owner_id === currentUserId

  return (
    <Link
      to={`/shopping-lists/${list.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-200 transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-800 dark:ring-white/10 dark:hover:shadow-none dark:focus-visible:outline-indigo-500"
    >
      {/* Icon header */}
      <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
        <ShoppingBagIcon
          aria-hidden="true"
          className="size-6 text-indigo-600 dark:text-indigo-400"
        />
        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isOwner
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
            }`}
          >
            {isOwner ? 'Owner' : 'Member'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRename(list)
            }}
            aria-label={`Rename "${list.title}"`}
            className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:outline-indigo-500"
          >
            <PencilIcon aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(list)
            }}
            aria-label={`Delete "${list.title}"`}
            className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
          {list.title}
        </h3>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-1">
            <UserGroupIcon aria-hidden="true" className="size-4" />
            Shared
          </span>
        </div>
      </div>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10"
        >
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
            <div className="size-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-600" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="size-12 text-red-500 dark:text-red-400"
      />
      <h2 className="mt-4 font-display text-xl font-semibold text-gray-900 dark:text-white">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        We couldn't load your shopping lists. Please check your connection and
        try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        <ArrowPathIcon aria-hidden="true" className="size-4" />
        Try again
      </button>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
        <ShoppingBagIcon
          aria-hidden="true"
          className="size-12 text-indigo-600 dark:text-indigo-400"
        />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-gray-900 dark:text-white">
        No shopping lists yet
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Create your first shopping list to start tracking ingredients and
        collaborating with others.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        <PlusIcon aria-hidden="true" className="size-5" />
        Create your first list
      </button>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const ShoppingListsPage = () => {
  const { user } = useAuth()
  const {
    data: lists,
    isLoading,
    isError,
    refetch,
  } = useShoppingLists()
  const createMutation = useCreateShoppingList()
  const updateMutation = useUpdateShoppingList()
  const deleteMutation = useDeleteShoppingList()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [renameTarget, setRenameTarget] = useState<{
    id: string
    title: string
  } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    title: string
  } | null>(null)

  const filteredLists = useMemo(() => {
    if (!lists) return []
    if (!search.trim()) return lists
    const query = search.trim().toLowerCase()
    return lists.filter((l) => l.title.toLowerCase().includes(query))
  }, [lists, search])

  const openCreateDialog = useCallback(() => {
    setNewListTitle('')
    setIsCreateOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    const title = newListTitle.trim()
    if (!title) return

    createMutation.mutate(
      { title },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setNewListTitle('')
        },
      },
    )
  }, [newListTitle, createMutation])

  const openRenameDialog = useCallback(
    (list: { id: string; title: string }) => {
      setRenameTarget(list)
      setRenameValue(list.title)
    },
    [],
  )

  const handleRename = useCallback(() => {
    if (!renameTarget) return
    const title = renameValue.trim()
    if (!title || title === renameTarget.title) {
      setRenameTarget(null)
      return
    }

    updateMutation.mutate(
      { id: renameTarget.id, title },
      { onSuccess: () => setRenameTarget(null) },
    )
  }, [renameTarget, renameValue, updateMutation])

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteMutation])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Shopping Lists
        </h1>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
        >
          <PlusIcon aria-hidden="true" className="size-5" />
          New List
        </button>
      </div>

      {/* Search — only show when there are lists or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="list-search" className="sr-only">
            Search shopping lists
          </label>
          <ShoppingBagIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            id="list-search"
            type="text"
            placeholder="Search lists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
          />
        </div>
      )}

      {/* Content */}
      {isLoading && <LoadingSkeleton />}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && filteredLists.length === 0 && (
        <EmptyState onCreate={openCreateDialog} />
      )}

      {!isLoading && !isError && filteredLists.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              currentUserId={user?.id ?? ''}
              onRename={openRenameDialog}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* No results for search (lists exist but filter yielded nothing) */}
      {!isLoading &&
        !isError &&
        lists &&
        lists.length > 0 &&
        filteredLists.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <ShoppingBagIcon
              aria-hidden="true"
              className="size-10 text-gray-300 dark:text-gray-600"
            />
            <p className="mt-4 text-sm/6 text-gray-500 dark:text-gray-400">
              No lists match &quot;{search}&quot;
            </p>
          </div>
        )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={openCreateDialog}
        aria-label="New List"
        className="fixed bottom-20 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:hidden dark:bg-indigo-500 dark:focus-visible:outline-indigo-400"
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </button>

      {/* Create list dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-950/50 transition-opacity data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-950/80"
        />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-800 sm:p-8"
            >
              <DialogTitle className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                New shopping list
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                Give your list a name to get started.
              </p>

              <div className="mt-4">
                <label
                  htmlFor="new-list-title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  List name
                </label>
                <input
                  id="new-list-title"
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                  }}
                  placeholder="e.g. Weekly Groceries"
                  autoFocus
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !newListTitle.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
                >
                  {createMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating…
                    </>
                  ) : (
                    'Create list'
                  )}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Rename list dialog */}
      <Dialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-950/50 transition-opacity data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-950/80"
        />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-800 sm:p-8"
            >
              <DialogTitle className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                Rename list
              </DialogTitle>

              <div className="mt-4">
                <label
                  htmlFor="rename-list-title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  List name
                </label>
                <input
                  id="rename-list-title"
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename()
                  }}
                  autoFocus
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={
                    updateMutation.isPending ||
                    !renameValue.trim() ||
                    renameValue.trim() === renameTarget?.title
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
                >
                  {updateMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Renaming…
                    </>
                  ) : (
                    <>
                      <CheckIcon aria-hidden="true" className="size-4" />
                      Rename
                    </>
                  )}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Delete list confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-950/50 transition-opacity data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-950/80"
        />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-gray-800 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="size-5 text-red-600 dark:text-red-400"
                  />
                </div>
                <div className="flex-1">
                  <DialogTitle className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                    Delete list?
                  </DialogTitle>
                  <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete &quot;{deleteTarget?.title}
                    &quot;? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <TrashIcon aria-hidden="true" className="size-4" />
                      Delete list
                    </>
                  )}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default ShoppingListsPage
