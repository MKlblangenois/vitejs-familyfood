import { useState, useCallback, useMemo } from 'react'
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
      className={`flex items-center gap-3 rounded-control border px-3 py-2.5 transition-colors ${
        item.checked
          ? 'border-sand-200/60 bg-sand-50/50 dark:border-white/5 dark:bg-white/[0.02]'
          : 'border-sand-200 bg-white dark:border-white/10 dark:bg-forest-900'
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        aria-label={item.checked ? `Décocher « ${item.name} »` : `Cocher « ${item.name} »`}
        className={`flex size-7 shrink-0 items-center justify-center rounded-control border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:focus-visible:outline-forest-400 ${
          item.checked
            ? 'border-forest bg-forest text-white dark:border-forest-400 dark:bg-forest-400'
            : 'border-sand-300 bg-cream text-transparent hover:border-forest-400 dark:border-white/20 dark:bg-transparent dark:hover:border-forest-400'
        }`}
      >
        {item.checked && <CheckIcon aria-hidden="true" className="size-4" />}
      </button>

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span
          className={`text-sm font-medium transition-colors ${
            item.checked
              ? 'text-ink-400 line-through dark:text-ink-500'
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
          className="rounded-control p-1.5 text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
        >
          <PencilIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label={`Supprimer « ${item.name} »`}
          className="rounded-control p-1.5 text-ink-400 transition-colors hover:bg-error-50 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500"
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
      className="flex flex-col gap-2 rounded-card border border-dashed border-sand-300 bg-sand-50 p-3 dark:border-white/10 dark:bg-white/[0.02]"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l’article"
          aria-label="Nom de l’article"
          className="min-w-0 flex-1 rounded-control border border-sand-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qté"
          aria-label="Quantité"
          min="0"
          step="any"
          className="w-20 rounded-control border border-sand-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unité"
          aria-label="Unité"
          className="w-20 rounded-control border border-sand-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        isLoading={addItemMutation.isPending}
        disabled={addItemMutation.isPending || !name.trim()}
        icon={!addItemMutation.isPending ? <PlusIcon aria-hidden="true" className="size-4" /> : undefined}
      >
        {addItemMutation.isPending ? 'Ajout…' : 'Ajouter un article'}
      </Button>
    </form>
  )
}

function DetailLoadingState() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="h-5 w-24 animate-pulse rounded-control bg-sand-200 dark:bg-white/10" />
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-2/3" />
        <LoadingSkeleton lines={2} className="w-1/3" />
      </div>
      <LoadingSkeleton className="h-3 w-full rounded-pill" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-control bg-sand-200 dark:bg-white/10"
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
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-ink-300">
        <ShoppingBagIcon aria-hidden="true" className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">
        Liste introuvable
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-ink-500 dark:text-ink-300">
        Cette liste de courses a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/shopping-lists"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-control bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
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

const ShoppingListDetailPage = () => {
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
        quantity: editItemQuantity.trim() ? Number(editItemQuantity.trim()) : null,
        unit: editItemUnit.trim() || null,
      },
      { onSuccess: () => setEditingItem(null) },
    )
  }, [editingItem, list, editItemName, editItemQuantity, editItemUnit, updateItemMutation])

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
  if (isError) return <ErrorState title="Impossible de charger la liste de courses" description="Une erreur est survenue lors du chargement de cette liste. Vérifiez votre connexion et réessayez." onRetry={() => void refetch()} />
  if (isFetched && !list) return <DetailNotFoundState />
  if (!list) return null

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/shopping-lists"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink dark:text-ink-300 dark:hover:text-white"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Toutes les listes
      </Link>

      {/* Title + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
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
                className="flex-1 rounded-control border border-forest-500 bg-white px-3 py-2 text-xl font-bold text-ink shadow-soft focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-forest-400 dark:bg-white/5 dark:text-white dark:focus:ring-forest-400 dark:focus:outline-forest-400 sm:text-2xl"
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
              <h1 className="font-display text-2xl font-bold text-ink dark:text-white sm:text-3xl">
                {list.title}
              </h1>
              <button
                type="button"
                onClick={startEditTitle}
                aria-label="Modifier le titre"
                className="mt-1 rounded-control p-1 text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
              >
                <PencilIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          )}

          {/* Owner/member badge + member count */}
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={isOwner ? 'forest' : 'neutral'}>
              {isOwner ? 'Propriétaire' : 'Éditeur'}
            </Badge>
            <span className="text-xs text-ink-500 dark:text-ink-300">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-control border border-error-200 bg-white px-3 py-2 text-sm font-semibold text-error transition-colors hover:bg-error-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 dark:border-error-500/20 dark:bg-white/5 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-500"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-6">
          <ProgressBar value={completionPercent} />
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-300">
            {checkedItems.length} sur {items.length} article{items.length !== 1 ? 's' : ''} terminé{checkedItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Add item */}
      <section aria-labelledby="add-item-heading" className="mb-6">
        <h2 id="add-item-heading" className="sr-only">
          Ajouter un article
        </h2>
        <AddItemRow listId={list.id} />
      </section>

      {/* Items */}
      <section aria-labelledby="items-heading" className="mb-8">
        <h2
          id="items-heading"
          className="mb-4 font-display text-xl font-bold text-ink dark:text-white"
        >
          Articles
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-ink-400 dark:text-ink-300">
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
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
          <Button
            variant="secondary"
            onClick={() => setIsShareOpen(false)}
          >
            Terminé
          </Button>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Ajoutez des membres avec leur identifiant utilisateur.
          L&apos;ajout par e-mail n&apos;est actuellement pas pris en charge
          (l&apos;e-mail n&apos;est pas accessible via RLS).
        </p>

        {/* Add member form */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={shareUserId}
            onChange={(e) => setShareUserId(e.target.value)}
            placeholder="Identifiant utilisateur"
            aria-label="Identifiant utilisateur à ajouter comme membre"
            className="min-w-0 flex-1 rounded-control border border-sand-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
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
          <p className="mt-2 text-sm text-error dark:text-error-400">
            Échec de l&apos;ajout du membre. Vérifiez l&apos;identifiant
            utilisateur et réessayez.
          </p>
        )}

        {/* Current members */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Membres actuels
          </h3>
          <ul className="mt-2 divide-y divide-sand-200 dark:divide-white/10" role="list">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-sand-100 text-xs font-medium text-ink-600 dark:bg-white/10 dark:text-ink-300">
                    {member.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-white">
                      {member.user_id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-ink-400 dark:text-ink-300">
                      {member.role}
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={removeMemberMutation.isPending}
                    aria-label={`Retirer le membre ${member.user_id.slice(0, 8)}`}
                    className="rounded-control p-1 text-ink-400 transition-colors hover:bg-error-50 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500"
                  >
                    <XMarkIcon aria-hidden="true" className="size-4" />
                  </button>
                )}
              </li>
            ))}
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
              {deleteItemMutation.isPending ? 'Suppression…' : 'Supprimer l\'article'}
            </Button>
          </>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Voulez-vous vraiment supprimer « {deletingItem?.name} » ?
          Cette action est irréversible.
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
              {deleteListMutation.isPending ? 'Suppression…' : 'Supprimer la liste'}
            </Button>
          </>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Voulez-vous vraiment supprimer « {list.title} » ? Tous les
          articles et membres seront supprimés. Cette action est
          irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default ShoppingListDetailPage
