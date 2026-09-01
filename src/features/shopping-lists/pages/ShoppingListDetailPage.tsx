import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
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

// ============================================================
// Sub-components
// ============================================================

function ItemRow({
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
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        item.checked
          ? 'border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-white/[0.02]'
          : 'border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800'
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        aria-label={item.checked ? `Décocher « ${item.name} »` : `Cocher « ${item.name} »`}
        className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500 ${
          item.checked
            ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400'
            : 'border-gray-300 bg-white text-transparent hover:border-indigo-400 dark:border-gray-600 dark:bg-transparent dark:hover:border-indigo-400'
        }`}
      >
        {item.checked && <CheckIcon aria-hidden="true" className="size-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium ${
            item.checked
              ? 'text-gray-400 line-through dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {item.name}
        </span>
        {(item.quantity !== null || item.unit !== null) && (
          <span
            className={`ml-2 text-xs ${
              item.checked
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {item.quantity ?? ''} {item.unit ?? ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          aria-label={`Modifier « ${item.name} »`}
          className="rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:outline-indigo-500"
        >
          <PencilIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label={`Supprimer « ${item.name} »`}
          className="rounded-md p-1 text-gray-400 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-gray-500 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
        >
          <TrashIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}

function AddItemRow({ listId }: { listId: string }) {
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
      className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.02]"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l’article"
          aria-label="Nom de l’article"
          className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qté"
          aria-label="Quantité"
          min="0"
          step="any"
          className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unité"
          aria-label="Unité"
          className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={addItemMutation.isPending || !name.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        {addItemMutation.isPending ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Ajout…
          </>
        ) : (
          <>
            <PlusIcon aria-hidden="true" className="size-4" />
            Ajouter un article
          </>
        )}
      </button>
    </form>
  )
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-600" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-gray-100 dark:bg-gray-600"
            style={{ width: `${90 - i * 5}%` }}
          />
        ))}
      </div>
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
        Impossible de charger la liste de courses
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Une erreur est survenue lors du chargement de cette liste. Vérifiez
        votre connexion et réessayez.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        <ArrowPathIcon aria-hidden="true" className="size-4" />
        Réessayer
      </button>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <ShoppingBagIcon
        aria-hidden="true"
        className="size-16 text-gray-300 dark:text-gray-600"
      />
      <h2 className="mt-6 font-display text-2xl font-bold text-gray-900 dark:text-white">
        Liste introuvable
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Cette liste de courses a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/shopping-lists"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
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

  if (!id) return <NotFoundState />
  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isFetched && !list) return <NotFoundState />
  if (!list) return null

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/shopping-lists"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
                className="flex-1 rounded-lg border border-indigo-500 bg-white px-3 py-2 text-xl font-bold text-gray-900 shadow-xs focus:outline-2 focus:outline-indigo-600 dark:border-indigo-400 dark:bg-white/5 dark:text-white dark:focus:outline-indigo-500 sm:text-2xl"
              />
              <button
                type="button"
                onClick={saveTitle}
                disabled={updateListMutation.isPending}
                aria-label="Enregistrer le titre"
                className="inline-flex size-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
              >
                <CheckIcon aria-hidden="true" className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsTitleEditing(false)}
                aria-label="Annuler la modification du titre"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
              >
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {list.title}
              </h1>
              <button
                type="button"
                onClick={startEditTitle}
                aria-label="Modifier le titre"
                className="mt-1 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:outline-indigo-500"
              >
                <PencilIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          )}

          {/* Owner/member badge + member avatars */}
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOwner
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
              }`}
            >
              {isOwner ? 'Propriétaire' : 'Éditeur'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
            >
              <UserGroupIcon aria-hidden="true" className="size-4" />
              Partager
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsDeleteListOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-red-500/20 dark:bg-white/5 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:outline-red-500"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

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
          className="mb-4 font-display text-xl font-bold text-gray-900 dark:text-white"
        >
          Articles
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
              {checkedItems.length}/{items.length}
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center dark:border-white/10">
            <ShoppingBagIcon
              aria-hidden="true"
              className="mx-auto size-10 text-gray-300 dark:text-gray-600"
            />
            <p className="mt-3 text-sm/6 text-gray-500 dark:text-gray-400">
              Aucun article pour le moment. Ajoutez votre premier article
              ci-dessus.
            </p>
          </div>
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
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
      <Dialog
        open={isShareOpen}
        onClose={() => {
          setIsShareOpen(false)
          setShareUserId('')
        }}
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
                Partager la liste
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
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
                  className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={addMemberMutation.isPending || !shareUserId.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
                >
                  {addMemberMutation.isPending ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <UserPlusIcon aria-hidden="true" className="size-4" />
                      Ajouter
                    </>
                  )}
                </button>
              </div>

              {addMemberMutation.isError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Échec de l&apos;ajout du membre. Vérifiez l&apos;identifiant
                  utilisateur et réessayez.
                </p>
              )}

              {/* Current members */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Membres actuels
                </h3>
                <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/10" role="list">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          {member.user_id.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user_id.slice(0, 8)}…
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
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
                          className="rounded-md p-1 text-gray-400 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
                        >
                          <XMarkIcon aria-hidden="true" className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Terminé
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Edit item dialog */}
      <Dialog
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
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
                Modifier l&apos;article
              </DialogTitle>

              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="edit-item-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Nom
                  </label>
                  <input
                    id="edit-item-name"
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="edit-item-quantity"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Quantité
                    </label>
                    <input
                      id="edit-item-quantity"
                      type="number"
                      value={editItemQuantity}
                      onChange={(e) => setEditItemQuantity(e.target.value)}
                      min="0"
                      step="any"
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="edit-item-unit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Unité
                    </label>
                    <input
                      id="edit-item-unit"
                      type="text"
                      value={editItemUnit}
                      onChange={(e) => setEditItemUnit(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={updateItemMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveItem}
                  disabled={updateItemMutation.isPending || !editItemName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
                >
                  {updateItemMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <CheckIcon aria-hidden="true" className="size-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Delete item confirmation dialog */}
      <Dialog
        open={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
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
                    Supprimer l&apos;article ?
                  </DialogTitle>
                  <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                    Voulez-vous vraiment supprimer « {deletingItem?.name} » ?
                    Cette action est irréversible.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={deleteItemMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  disabled={deleteItemMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                >
                  {deleteItemMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <TrashIcon aria-hidden="true" className="size-4" />
                      Supprimer l&apos;article
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
        open={isDeleteListOpen}
        onClose={() => setIsDeleteListOpen(false)}
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
                    Supprimer la liste ?
                  </DialogTitle>
                  <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                    Voulez-vous vraiment supprimer « {list.title} » ? Tous les
                    articles et membres seront supprimés. Cette action est
                    irréversible.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteListOpen(false)}
                  disabled={deleteListMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteList}
                  disabled={deleteListMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                >
                  {deleteListMutation.isPending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <TrashIcon aria-hidden="true" className="size-4" />
                      Supprimer la liste
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

export default ShoppingListDetailPage
