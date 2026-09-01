import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useShoppingLists,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
  useRealtimeSync,
} from '../hooks'
import Button from '../../../shared/components/Button'
import Badge from '../../../shared/components/Badge'
import Modal from '../../../shared/components/Modal'
import TextField from '../../../shared/components/TextField'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'

// ============================================================
// Sub-components
// ============================================================

export function ListCard({
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
      className="group relative flex flex-col overflow-hidden rounded-card border border-sand-200 bg-white shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:border-white/10 dark:bg-forest-900 dark:focus-visible:outline-forest-400"
    >
      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink dark:text-white sm:text-xl">
            {list.title}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRename(list)
              }}
              aria-label={`Renommer « ${list.title} »`}
              className="rounded-control p-1.5 text-ink-400 opacity-0 transition-opacity hover:bg-sand-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 group-hover:opacity-100 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
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
              aria-label={`Supprimer « ${list.title} »`}
              className="rounded-control p-1.5 text-ink-400 opacity-0 transition-opacity hover:bg-error-50 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 group-hover:opacity-100 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        {/* Badge + meta */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Badge variant={isOwner ? 'forest' : 'neutral'}>
            {isOwner ? 'Propriétaire' : 'Membre'}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-ink-500 dark:text-ink-300">
            <UserGroupIcon aria-hidden="true" className="size-3.5" />
            Partagée
          </span>
        </div>
      </div>
    </Link>
  )
}

function ListsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-card border border-sand-200 bg-white dark:border-white/10 dark:bg-forest-900"
        >
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded-control bg-sand-200 dark:bg-white/10" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-20 animate-pulse rounded-pill bg-sand-200 dark:bg-white/10" />
              <div className="h-5 w-16 animate-pulse rounded-pill bg-sand-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const ShoppingListsPage = () => {
  const { user } = useAuth()
  useRealtimeSync()
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
        <h1 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
          Listes de courses
        </h1>

        <Button
          variant="primary"
          icon={<PlusIcon aria-hidden="true" className="size-5" />}
          onClick={openCreateDialog}
        >
          Nouvelle liste
        </Button>
      </div>

      {/* Search — only show when there are lists or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="list-search" className="sr-only">
            Rechercher des listes de courses
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400 dark:text-ink-300"
          />
          <input
            id="list-search"
            type="text"
            placeholder="Rechercher des listes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-control border border-sand-200 bg-cream py-3 pl-11 pr-4 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
          />
        </div>
      )}

      {/* Content */}
      {isLoading && <ListsLoadingSkeleton />}

      {isError && (
        <ErrorState
          title="Une erreur est survenue"
          description="Nous n'avons pas pu charger vos listes de courses. Veuillez vérifier votre connexion et réessayer."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filteredLists.length === 0 && (
        <EmptyState
          icon={<ShoppingBagIcon aria-hidden="true" className="size-7" />}
          title="Aucune liste de courses pour le moment"
          description="Créez votre première liste de courses pour commencer à suivre vos ingrédients et collaborer avec d'autres."
          action={
            <Button
              variant="primary"
              icon={<PlusIcon aria-hidden="true" className="size-5" />}
              onClick={openCreateDialog}
            >
              Créer votre première liste
            </Button>
          }
        />
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
            <div className="flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-ink-300">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="mt-4 text-sm/6 text-ink-500 dark:text-ink-300">
              Aucune liste ne correspond à « {search} »
            </p>
          </div>
        )}

      {/* Mobile FAB */}
      <Button
        variant="primary"
        aria-label="Nouvelle liste"
        onClick={openCreateDialog}
        icon={<PlusIcon aria-hidden="true" className="size-6" />}
        className="fixed bottom-20 right-5 z-30 flex size-14 !rounded-full !p-0 shadow-float transition-transform hover:scale-105 sm:hidden"
      />

      {/* Create list dialog */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle liste de courses"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending || !newListTitle.trim()}
            >
              {createMutation.isPending ? 'Création…' : 'Créer la liste'}
            </Button>
          </>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Donnez un nom à votre liste pour commencer.
        </p>
        <div className="mt-4">
          <TextField
            id="new-list-title"
            label="Nom de la liste"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="p. ex. Courses de la semaine"
            autoFocus
          />
        </div>
      </Modal>

      {/* Rename list dialog */}
      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Renommer la liste"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRenameTarget(null)}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRename}
              isLoading={updateMutation.isPending}
              disabled={
                updateMutation.isPending ||
                !renameValue.trim() ||
                renameValue.trim() === renameTarget?.title
              }
            >
              {updateMutation.isPending ? 'Renommage…' : 'Renommer'}
            </Button>
          </>
        }
      >
        <TextField
          id="rename-list-title"
          label="Nom de la liste"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename()
          }}
          autoFocus
        />
      </Modal>

      {/* Delete list confirmation dialog */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la liste ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer la liste'}
            </Button>
          </>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Voulez-vous vraiment supprimer « {deleteTarget?.title} » ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default ShoppingListsPage
