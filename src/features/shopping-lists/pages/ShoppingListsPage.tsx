import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpRightIcon,
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
import Modal from '../../../shared/components/Modal'
import TextField from '../../../shared/components/TextField'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'
import BrandMark from '../../../shared/components/BrandMark'

// ============================================================
// Sub-components
// ============================================================

export function ListCard({
  list,
  currentUserId,
  onRename,
  onDelete,
}: {
  list: {
    id: string
    title: string
    owner_id: string
    created_at: string
    updated_at: string
  }
  currentUserId: string
  onRename: (list: { id: string; title: string }) => void
  onDelete: (list: { id: string; title: string }) => void
}) {
  const isOwner = list.owner_id === currentUserId

  return (
    <article className="rounded-card border-sand-200/80 shadow-soft dark:bg-forest-900 flex min-w-0 flex-col border bg-white p-5 sm:p-6 dark:border-white/10">
      <div className="mb-6 flex items-start justify-between gap-3">
        <span className="rounded-control bg-sage-50 text-forest-600 dark:text-sage-300 flex size-11 items-center justify-center dark:bg-white/10">
          <ShoppingBagIcon aria-hidden="true" className="size-5" />
        </span>
        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRename(list)}
              aria-label={`Renommer « ${list.title} »`}
              className="rounded-control text-ink-500 hover:bg-sand-100 hover:text-ink focus-visible:outline-forest-600 dark:text-ink-300 flex size-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/10"
            >
              <PencilIcon aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(list)}
              aria-label={`Supprimer « ${list.title} »`}
              className="rounded-control text-ink-500 hover:bg-error-50 hover:text-error focus-visible:outline-error-600 dark:text-ink-300 dark:hover:bg-error-500/10 flex size-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
      <Link
        to={`/shopping-lists/${list.id}`}
        className="group focus-visible:outline-forest-600 dark:focus-visible:outline-forest-400 mt-auto flex min-h-16 items-end justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div className="min-w-0">
          <p className="text-sage-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.16em] uppercase">
            {isOwner ? 'Votre liste' : 'Liste partagée'}
          </p>
          <h3 className="font-display text-ink mt-2 text-2xl leading-tight font-medium break-words dark:text-white">
            {list.title}
          </h3>
          <span className="text-ink-500 dark:text-ink-300 mt-2 block text-xs">
            {isOwner ? 'Propriétaire' : 'Membre'}
          </span>
        </div>
        <span className="bg-sage-50 text-forest-600 group-hover:bg-sage-100 dark:text-sage-300 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors dark:bg-white/10">
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </span>
      </Link>
    </article>
  )
}

function ListsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border-sand-200 dark:bg-forest-900 animate-pulse overflow-hidden border bg-white dark:border-white/10"
        >
          <div className="space-y-3 p-5">
            <div className="rounded-control bg-sand-200 h-5 w-3/4 animate-pulse dark:bg-white/10" />
            <div className="flex gap-2 pt-1">
              <div className="rounded-pill bg-sand-200 h-5 w-20 animate-pulse dark:bg-white/10" />
              <div className="rounded-pill bg-sand-200 h-5 w-16 animate-pulse dark:bg-white/10" />
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
  const { data: lists, isLoading, isError, refetch } = useShoppingLists()
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
      <header className="relative mb-8 overflow-hidden pt-14 sm:mb-12 sm:pt-16">
        <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
          Pour ne rien oublier
        </p>
        <h1 className="font-display text-forest dark:text-cream relative z-10 mt-5 max-w-[14ch] text-[clamp(2.8rem,8vw,4.75rem)] leading-[1.08] font-medium tracking-[-0.04em]">
          <span className="sr-only">Listes de courses : </span>Les courses,
          <br />
          <span className="text-sage-400 dark:text-sage-300 font-normal italic">
            tout simplement.
          </span>
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-5 max-w-md text-sm/6 sm:text-base">
          Vos listes à portée de main, pour faire les courses ensemble.
        </p>
        <BrandMark className="text-sage-100 pointer-events-none absolute top-14 right-0 size-14 sm:top-16 sm:right-8 sm:size-28 dark:text-white/10" />
        <Button
          variant="primary"
          icon={<PlusIcon aria-hidden="true" className="size-5" />}
          onClick={openCreateDialog}
          className="relative mt-6 min-h-11"
        >
          Nouvelle liste
        </Button>
      </header>

      {/* Search — only show when there are lists or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="list-search" className="sr-only">
            Rechercher des listes de courses
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="text-ink-400 dark:text-ink-300 pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            id="list-search"
            type="text"
            placeholder="Rechercher des listes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 block w-full border bg-white py-3 pr-4 pl-11 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
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

      {!isLoading && !isError && lists?.length === 0 && (
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
        <section aria-labelledby="lists-heading">
          <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
            À portée de main
          </p>
          <h2
            id="lists-heading"
            className="font-display text-ink mt-2 mb-6 text-2xl font-medium tracking-tight sm:text-3xl dark:text-white"
          >
            Vos listes de courses
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      )}

      {/* No results for search (lists exist but filter yielded nothing) */}
      {!isLoading &&
        !isError &&
        lists &&
        lists.length > 0 &&
        filteredLists.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <div className="bg-sand-100 text-ink-400 dark:text-ink-300 flex size-14 items-center justify-center rounded-full dark:bg-white/10">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="text-ink-500 dark:text-ink-300 mt-4 text-sm/6">
              Aucune liste ne correspond à « {search} »
            </p>
          </div>
        )}

      <Button
        variant="primary"
        aria-label="Nouvelle liste"
        onClick={openCreateDialog}
        icon={<PlusIcon aria-hidden="true" className="size-6" />}
        className="shadow-float active:bg-forest-700 fixed right-5 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] z-30 flex size-14 !rounded-full !p-0 sm:hidden"
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
        <p className="text-ink-500 dark:text-ink-300 text-sm/6">
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
        <p className="text-ink-500 dark:text-ink-300 text-sm/6">
          Voulez-vous vraiment supprimer « {deleteTarget?.title} » ? Cette
          action est irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default ShoppingListsPage
