import { DetailDrawerContext } from '../../../shared/components/detailDrawerContext'
import { useState, useCallback, useMemo, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
  useAddItem,
  useUpdateItem,
  useDeleteItem,
  useToggleItem,
  useAddMember,
  useRemoveMember,
  useRealtimeSync,
} from '../hooks'
import type { ShoppingListItem, ShoppingListMember } from '../types'
import { ROLE_LABELS } from '../lib/roleLabels'
import Button from '../../../shared/components/Button'
import Badge from '../../../shared/components/Badge'
import Modal from '../../../shared/components/Modal'
import TextField from '../../../shared/components/TextField'
import ProgressBar from '../../../shared/components/ProgressBar'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'

// ============================================================
// Sub-components
// ============================================================

export function ItemRow({
  item,
  listId,
  onEdit,
  onDelete,
}: {
  item: ShoppingListItem
  listId: string
  onEdit: (item: ShoppingListItem) => void
  onDelete: (item: ShoppingListItem) => void
}) {
  const toggleMutation = useToggleItem()

  const handleToggle = useCallback(() => {
    toggleMutation.mutate({
      id: item.id,
      list_id: listId,
      checked: !item.checked,
    })
  }, [item.id, item.checked, listId, toggleMutation])

  return (
    <li
      className={`rounded-control flex items-center gap-1 border px-2 py-2 transition-colors sm:gap-3 sm:px-3 ${
        item.checked
          ? 'border-sand-200/60 bg-sand-50/50 dark:border-white/5 dark:bg-white/[0.02]'
          : 'border-sand-200 dark:bg-forest-900 bg-white dark:border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        aria-label={
          item.checked ? `Décocher « ${item.name} »` : `Cocher « ${item.name} »`
        }
        className="rounded-control focus-visible:outline-forest-600 dark:focus-visible:outline-forest-400 flex size-11 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          className={`flex size-6 items-center justify-center rounded-lg border-2 transition-colors ${item.checked ? 'border-forest bg-forest dark:border-forest-400 dark:bg-forest-400 text-white' : 'border-sand-300 bg-cream text-transparent dark:border-white/20 dark:bg-transparent'}`}
        >
          {item.checked && <CheckIcon aria-hidden="true" className="size-4" />}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={`min-w-0 text-sm font-medium break-words transition-colors ${
            item.checked
              ? 'text-ink-400 dark:text-ink-500 line-through'
              : 'text-ink dark:text-white'
          }`}
        >
          {item.name}
        </span>
        {(item.quantity !== null || item.unit !== null) && (
          <span
            className={`shrink-0 text-xs ${
              item.checked
                ? 'text-ink-400 dark:text-ink-600'
                : 'text-ink-400 dark:text-ink-300'
            }`}
          >
            {item.quantity ?? ''} {item.unit ?? ''}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          aria-label={`Modifier « ${item.name} »`}
          className="rounded-control text-ink-400 hover:bg-sand-100 hover:text-ink focus-visible:outline-forest-600 dark:text-ink-300 dark:focus-visible:outline-forest-400 flex size-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <PencilIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label={`Supprimer « ${item.name} »`}
          className="rounded-control text-ink-400 hover:bg-error-50 hover:text-error focus-visible:outline-error-600 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500 flex size-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <TrashIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}

export function AddItemRow({ listId }: { listId: string }) {
  const addItemMutation = useAddItem()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedName = name.trim()
      if (!trimmedName) return

      const parsedQuantity = quantity.trim() ? Number(quantity.trim()) : null
      const trimmedUnit = unit.trim() || null

      addItemMutation.mutate(
        {
          list_id: listId,
          name: trimmedName,
          quantity: parsedQuantity,
          unit: trimmedUnit,
        },
        {
          onSuccess: () => {
            setName('')
            setQuantity('')
            setUnit('')
          },
        },
      )
    },
    [name, quantity, unit, listId, addItemMutation],
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="shopping-item-form rounded-card border-sand-200 bg-sand-50 space-y-3 border p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l’article"
          aria-label="Nom de l’article"
          className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 col-span-2 min-w-0 border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 sm:col-span-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qté"
          aria-label="Quantité"
          min="0"
          step="any"
          className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 w-full min-w-0 border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unité"
          aria-label="Unité"
          className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 w-full min-w-0 border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        isLoading={addItemMutation.isPending}
        disabled={addItemMutation.isPending || !name.trim()}
        icon={
          !addItemMutation.isPending ? (
            <PlusIcon aria-hidden="true" className="size-4" />
          ) : undefined
        }
      >
        {addItemMutation.isPending ? 'Ajout…' : 'Ajouter un article'}
      </Button>
    </form>
  )
}

function DetailLoadingState() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="rounded-control bg-sand-200 h-5 w-24 animate-pulse dark:bg-white/10" />
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-2/3" />
        <LoadingSkeleton lines={2} className="w-1/3" />
      </div>
      <LoadingSkeleton className="rounded-pill h-3 w-full" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-control bg-sand-200 h-12 animate-pulse dark:bg-white/10"
            style={{ width: `${90 - i * 5}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function DetailNotFoundState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="bg-sand-100 text-ink-400 dark:text-ink-300 mb-5 flex size-14 items-center justify-center rounded-full dark:bg-white/10">
        <ShoppingBagIcon aria-hidden="true" className="size-7" />
      </div>
      <h2 className="font-display text-ink text-2xl font-semibold dark:text-white">
        Liste introuvable
      </h2>
      <p className="text-ink-500 dark:text-ink-300 mt-2 max-w-sm text-sm/6">
        Cette liste de courses a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/shopping-lists"
        className="rounded-control bg-forest hover:bg-forest-700 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Retour aux listes
      </Link>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

/** Display name for a member, falling back to the truncated UUID. */
function getMemberDisplayName(member: ShoppingListMember): string {
  return member.profile?.display_name || member.user_id.slice(0, 8)
}

const ShoppingListDetailPage = () => {
  const inDrawer = useContext(DetailDrawerContext)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  useRealtimeSync({ listId: id, enabled: !!id })
  const {
    data: list,
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useShoppingList(id ?? '')
  const updateListMutation = useUpdateShoppingList()
  const deleteListMutation = useDeleteShoppingList()
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()
  const addMemberMutation = useAddMember()
  const removeMemberMutation = useRemoveMember()

  // Dialog states
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareUserId, setShareUserId] = useState('')
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemQuantity, setEditItemQuantity] = useState('')
  const [editItemUnit, setEditItemUnit] = useState('')
  const [deletingItem, setDeletingItem] = useState<ShoppingListItem | null>(
    null,
  )

  const isOwner = list ? list.owner_id === user?.id : false

  const members = useMemo(
    () => list?.shopping_list_members ?? [],
    [list?.shopping_list_members],
  )
  const uncheckedItems = useMemo(
    () => (list?.shopping_list_items ?? []).filter((item) => !item.checked),
    [list?.shopping_list_items],
  )
  const checkedItems = useMemo(
    () => (list?.shopping_list_items ?? []).filter((item) => item.checked),
    [list?.shopping_list_items],
  )
  const items = useMemo(
    () => list?.shopping_list_items ?? [],
    [list?.shopping_list_items],
  )

  const completionPercent = useMemo(() => {
    if (items.length === 0) return 0
    return Math.round((checkedItems.length / items.length) * 100)
  }, [items.length, checkedItems.length])

  // Title editing
  const startEditTitle = useCallback(() => {
    if (!list) return
    setTitleValue(list.title)
    setIsTitleEditing(true)
  }, [list])

  const saveTitle = useCallback(() => {
    if (!list) return
    const title = titleValue.trim()
    if (!title || title === list.title) {
      setIsTitleEditing(false)
      return
    }

    updateListMutation.mutate(
      { id: list.id, title },
      { onSuccess: () => setIsTitleEditing(false) },
    )
  }, [list, titleValue, updateListMutation])

  // Item editing
  const startEditItem = useCallback((item: ShoppingListItem) => {
    setEditingItem(item)
    setEditItemName(item.name)
    setEditItemQuantity(item.quantity?.toString() ?? '')
    setEditItemUnit(item.unit ?? '')
  }, [])

  const saveItem = useCallback(() => {
    if (!editingItem || !list) return
    const name = editItemName.trim()
    if (!name) return

    updateItemMutation.mutate(
      {
        id: editingItem.id,
        list_id: list.id,
        name,
        quantity: editItemQuantity.trim()
          ? Number(editItemQuantity.trim())
          : null,
        unit: editItemUnit.trim() || null,
      },
      { onSuccess: () => setEditingItem(null) },
    )
  }, [
    editingItem,
    list,
    editItemName,
    editItemQuantity,
    editItemUnit,
    updateItemMutation,
  ])

  // Item deletion
  const confirmDeleteItem = useCallback(() => {
    if (!deletingItem || !list) return

    deleteItemMutation.mutate(
      { id: deletingItem.id, list_id: list.id },
      { onSuccess: () => setDeletingItem(null) },
    )
  }, [deletingItem, list, deleteItemMutation])

  // Member management
  const handleAddMember = useCallback(() => {
    if (!list || !shareUserId.trim()) return

    addMemberMutation.mutate(
      {
        list_id: list.id,
        user_id: shareUserId.trim(),
      },
      {
        onSuccess: () => {
          setShareUserId('')
        },
      },
    )
  }, [list, shareUserId, addMemberMutation])

  const handleRemoveMember = useCallback(
    (member: ShoppingListMember) => {
      if (!list) return

      removeMemberMutation.mutate({
        id: member.id,
        list_id: list.id,
      })
    },
    [list, removeMemberMutation],
  )

  // Delete list
  const handleDeleteList = useCallback(() => {
    if (!list) return

    deleteListMutation.mutate(list.id, {
      onSuccess: () => {
        setIsDeleteListOpen(false)
        void navigate('/shopping-lists')
      },
    })
  }, [list, deleteListMutation, navigate])

  if (!id) return <DetailNotFoundState />
  if (isLoading) return <DetailLoadingState />
  if (isError)
    return (
      <ErrorState
        title="Impossible de charger la liste de courses"
        description="Une erreur est survenue lors du chargement de cette liste. Vérifiez votre connexion et réessayez."
        onRetry={() => void refetch()}
      />
    )
  if (isFetched && !list) return <DetailNotFoundState />
  if (!list) return null

  return (
    <div className="mx-auto max-w-3xl pt-8 sm:pt-12">
      {/* Back link */}
      {!inDrawer && (
        <Link
          to="/shopping-lists"
          className="text-ink-500 hover:text-ink dark:text-ink-300 mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors dark:hover:text-white"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Toutes les listes
        </Link>
      )}

      {/* Title + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-forest-600 dark:text-sage-300 mb-4 text-[10px] font-bold tracking-[0.2em] uppercase">
            Pour ne rien oublier
          </p>
          {isTitleEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') setIsTitleEditing(false)
                }}
                autoFocus
                className="rounded-control border-forest-500 text-ink shadow-soft focus:ring-forest-500 focus:outline-forest-600 dark:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 flex-1 border bg-white px-3 py-2 text-xl font-bold focus:ring-1 focus:outline-2 focus:outline-offset-2 sm:text-2xl dark:bg-white/5 dark:text-white"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={saveTitle}
                disabled={updateListMutation.isPending}
                aria-label="Enregistrer le titre"
              >
                <CheckIcon aria-hidden="true" className="size-5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTitleEditing(false)}
                aria-label="Annuler la modification du titre"
              >
                <XMarkIcon aria-hidden="true" className="size-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <h1 className="font-display text-forest dark:text-cream min-w-0 text-4xl leading-tight font-medium tracking-tight break-words sm:text-5xl">
                {list.title}
              </h1>
              {isOwner && (
                <button
                  type="button"
                  onClick={startEditTitle}
                  aria-label="Modifier le titre"
                  className="rounded-control text-ink-400 hover:bg-sand-100 hover:text-ink focus-visible:outline-forest-600 dark:text-ink-300 dark:focus-visible:outline-forest-400 mt-1 flex size-11 shrink-0 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <PencilIcon aria-hidden="true" className="size-5" />
                </button>
              )}
            </div>
          )}

          {/* Owner/member badge + member count */}
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={isOwner ? 'forest' : 'neutral'}>
              {isOwner ? ROLE_LABELS.owner : ROLE_LABELS.editor}
            </Badge>
            <span className="text-ink-500 dark:text-ink-300 text-xs">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              variant="secondary"
              onClick={() => setIsShareOpen(true)}
              icon={<UserGroupIcon aria-hidden="true" className="size-4" />}
            >
              Partager
            </Button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsDeleteListOpen(true)}
              className="rounded-control border-error-200 text-error hover:bg-error-50 focus-visible:outline-error-600 dark:border-error-500/20 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-500 inline-flex items-center justify-center gap-1.5 border bg-white px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white/5"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="rounded-card bg-sage-50 mb-8 px-5 py-4 dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.16em] uppercase">
              Votre progression
            </span>
            <span className="text-forest dark:text-sage-300 text-sm font-semibold tabular-nums">
              {completionPercent} %
            </span>
          </div>
          <ProgressBar value={completionPercent} />
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-xs">
            {checkedItems.length} sur {items.length} article
            {items.length !== 1 ? 's' : ''} terminé
            {checkedItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Add item */}
      <section aria-labelledby="add-item-heading" className="mb-6">
        <h2
          id="add-item-heading"
          className="font-display text-ink mb-4 text-2xl font-medium dark:text-white"
        >
          Ajouter un article
        </h2>
        <AddItemRow listId={list.id} />
      </section>

      {/* Items */}
      <section aria-labelledby="items-heading" className="mb-8">
        <h2
          id="items-heading"
          className="font-display text-ink mb-4 text-2xl font-medium dark:text-white"
        >
          Articles
          {items.length > 0 && (
            <span className="text-ink-400 dark:text-ink-300 ml-2 text-sm font-normal">
              {checkedItems.length}/{items.length}
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon aria-hidden="true" className="size-7" />}
            title="Aucun article pour le moment"
            description="Ajoutez votre premier article ci-dessus."
          />
        ) : (
          <div className="space-y-6">
            {/* Unchecked items */}
            {uncheckedItems.length > 0 && (
              <ul className="space-y-2" role="list">
                {uncheckedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    listId={list.id}
                    onEdit={startEditItem}
                    onDelete={setDeletingItem}
                  />
                ))}
              </ul>
            )}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div>
                <h3 className="text-ink-400 dark:text-ink-500 mb-2 text-xs font-semibold tracking-wider uppercase">
                  Terminés
                </h3>
                <ul className="space-y-2" role="list">
                  {checkedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      listId={list.id}
                      onEdit={startEditItem}
                      onDelete={setDeletingItem}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Share / member management dialog */}
      <Modal
        open={isShareOpen}
        onClose={() => {
          setIsShareOpen(false)
          setShareUserId('')
        }}
        title="Partager la liste"
        footer={
          <Button variant="secondary" onClick={() => setIsShareOpen(false)}>
            Terminé
          </Button>
        }
      >
        <p className="text-ink-500 dark:text-ink-300 text-sm/6">
          Ajoutez des membres avec leur identifiant utilisateur. L&apos;ajout
          par e-mail n&apos;est actuellement pas pris en charge (l&apos;e-mail
          n&apos;est pas accessible via RLS).
        </p>

        {/* Add member form */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={shareUserId}
            onChange={(e) => setShareUserId(e.target.value)}
            placeholder="Identifiant utilisateur"
            aria-label="Identifiant utilisateur à ajouter comme membre"
            className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 min-w-0 flex-1 border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddMember}
            isLoading={addMemberMutation.isPending}
            disabled={addMemberMutation.isPending || !shareUserId.trim()}
          >
            {addMemberMutation.isPending ? undefined : 'Ajouter'}
          </Button>
        </div>

        {addMemberMutation.isError && (
          <p className="text-error dark:text-error-400 mt-2 text-sm">
            Échec de l&apos;ajout du membre. Vérifiez l&apos;identifiant
            utilisateur et réessayez.
          </p>
        )}

        {/* Current members */}
        <div className="mt-6">
          <h3 className="text-ink-700 dark:text-ink-200 text-sm font-medium">
            Membres actuels
          </h3>
          <ul
            className="divide-sand-200 mt-2 divide-y dark:divide-white/10"
            role="list"
          >
            {members.map((member) => {
              const memberName = getMemberDisplayName(member)
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-sand-100 text-ink-600 dark:text-ink-300 flex size-8 items-center justify-center rounded-full text-xs font-medium dark:bg-white/10">
                        {memberName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-ink text-sm font-medium dark:text-white">
                        {member.profile?.display_name || `${memberName}…`}
                      </p>
                      <p className="text-ink-400 dark:text-ink-300 text-xs">
                        {ROLE_LABELS[member.role]}
                      </p>
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removeMemberMutation.isPending}
                      aria-label={`Retirer le membre ${memberName}`}
                      className="rounded-control text-ink-400 hover:bg-error-50 hover:text-error focus-visible:outline-error-600 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500 p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XMarkIcon aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </Modal>

      {/* Edit item dialog */}
      <Modal
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title="Modifier l'article"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingItem(null)}
              disabled={updateItemMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={saveItem}
              isLoading={updateItemMutation.isPending}
              disabled={updateItemMutation.isPending || !editItemName.trim()}
            >
              {updateItemMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextField
            id="edit-item-name"
            label="Nom"
            value={editItemName}
            onChange={(e) => setEditItemName(e.target.value)}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <TextField
                id="edit-item-quantity"
                label="Quantité"
                type="number"
                value={editItemQuantity}
                onChange={(e) => setEditItemQuantity(e.target.value)}
                min="0"
                step="any"
              />
            </div>
            <div className="flex-1">
              <TextField
                id="edit-item-unit"
                label="Unité"
                value={editItemUnit}
                onChange={(e) => setEditItemUnit(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete item confirmation dialog */}
      <Modal
        open={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        title="Supprimer l'article ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingItem(null)}
              disabled={deleteItemMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteItem}
              isLoading={deleteItemMutation.isPending}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending
                ? 'Suppression…'
                : "Supprimer l'article"}
            </Button>
          </>
        }
      >
        <p className="text-ink-500 dark:text-ink-300 text-sm/6">
          Voulez-vous vraiment supprimer « {deletingItem?.name} » ? Cette action
          est irréversible.
        </p>
      </Modal>

      {/* Delete list confirmation dialog */}
      <Modal
        open={isDeleteListOpen}
        onClose={() => setIsDeleteListOpen(false)}
        title="Supprimer la liste ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteListOpen(false)}
              disabled={deleteListMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteList}
              isLoading={deleteListMutation.isPending}
              disabled={deleteListMutation.isPending}
            >
              {deleteListMutation.isPending
                ? 'Suppression…'
                : 'Supprimer la liste'}
            </Button>
          </>
        }
      >
        <p className="text-ink-500 dark:text-ink-300 text-sm/6">
          Voulez-vous vraiment supprimer « {list.title} » ? Tous les articles et
          membres seront supprimés. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default ShoppingListDetailPage
