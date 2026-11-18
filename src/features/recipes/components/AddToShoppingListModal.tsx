import { useMemo, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ShoppingBagIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useShoppingLists, useShoppingList } from '../../shopping-lists/hooks'
import { useAddRecipeToShoppingList } from '../hooks'
import {
  flattenSelectedIngredients,
  scaleIngredients,
  buildShoppingListChanges,
} from '../lib/recipeToShoppingList'
import { formatQuantity } from '../lib/servingScaling'
import type { RecipeWithRelations } from '../types'

// ============================================================
// AddToShoppingListModal — lets the user add a recipe's ingredients
// to one of their shopping lists, with serving-adjusted quantities,
// per-ingredient selection, and duplicate detection/merge.
// ============================================================

interface AddToShoppingListModalProps {
  open: boolean
  onClose: () => void
  recipe: RecipeWithRelations
  initialServings?: number
}

const AddToShoppingListModal = ({
  open,
  onClose,
  recipe,
  initialServings,
}: AddToShoppingListModalProps) => {
  const { data: lists, isLoading: listsLoading } = useShoppingLists()
  const mutation = useAddRecipeToShoppingList()

  const allIngredientIds = useMemo(
    () =>
      recipe.recipe_ingredient_groups.flatMap((group) =>
        group.recipe_ingredients.map((ingredient) => ingredient.id),
      ),
    [recipe],
  )

  const [selectedListId, setSelectedListId] = useState('')
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<
    Set<string>
  >(() => new Set(allIngredientIds))
  const [targetServings, setTargetServings] = useState(
    initialServings ?? recipe.servings,
  )
  const [success, setSuccess] = useState(false)

  // Reset the form's internal state each time the dialog is opened so a
  // previously submitted/edited state doesn't leak into the next open.
  useEffect(() => {
    if (open) {
      setSelectedListId('')
      setSelectedIngredientIds(new Set(allIngredientIds))
      setTargetServings(initialServings ?? recipe.servings)
      setSuccess(false)
    }
  }, [open, allIngredientIds, initialServings, recipe.servings])

  const { data: targetList, isLoading: targetListLoading } =
    useShoppingList(selectedListId)

  const toggleIngredient = useCallback((id: string) => {
    setSelectedIngredientIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIngredientIds((prev) =>
      prev.size === allIngredientIds.length
        ? new Set()
        : new Set(allIngredientIds),
    )
  }, [allIngredientIds])

  // Scale the selected ingredients to the target servings.
  const scaledIngredients = useMemo(() => {
    const selected = flattenSelectedIngredients(recipe, [
      ...selectedIngredientIds,
    ])
    return scaleIngredients(selected, recipe.servings, targetServings)
  }, [recipe, selectedIngredientIds, targetServings])

  // Live "added vs merged" summary against the selected list's items.
  const summary = useMemo(() => {
    if (!targetList) {
      return { addedCount: scaledIngredients.length, mergedCount: 0 }
    }
    const changes = buildShoppingListChanges(
      scaledIngredients,
      targetList.shopping_list_items,
      targetList.id,
      null,
    )
    return { addedCount: changes.addedCount, mergedCount: changes.mergedCount }
  }, [scaledIngredients, targetList])

  const hasSelectedIngredients = selectedIngredientIds.size > 0
  const canSubmit =
    !!selectedListId &&
    hasSelectedIngredients &&
    !targetListLoading &&
    !!targetList

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !targetList) return

    mutation.mutate(
      {
        recipe,
        list: targetList,
        selectedIngredientIds: [...selectedIngredientIds],
        targetServings,
      },
      {
        onSuccess: () => setSuccess(true),
      },
    )
  }, [
    canSubmit,
    targetList,
    mutation,
    recipe,
    selectedIngredientIds,
    targetServings,
  ])

  const handleClose = useCallback(() => {
    if (mutation.isPending) return
    onClose()
  }, [mutation.isPending, onClose])

  const hasNoLists = !listsLoading && lists && lists.length === 0

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink-950/50 dark:bg-ink-950/80 fixed inset-0 z-[60]" />
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4">
          <Dialog.Content
            aria-describedby={undefined}
            className="rounded-card shadow-float dark:bg-ink-900 pointer-events-auto w-full max-w-lg bg-white p-6 text-left outline-none sm:p-8"
          >
            {success ? (
              // ============================================================
              // Success state
              // ============================================================
              <div className="flex flex-col items-center py-6 text-center">
                <div className="bg-sage-50 dark:bg-sage-500/10 flex size-12 items-center justify-center rounded-full">
                  <CheckIcon
                    aria-hidden="true"
                    className="text-forest dark:text-sage-400 size-6"
                  />
                </div>
                <Dialog.Title className="font-display text-ink mt-4 text-lg font-semibold dark:text-white">
                  Ajouté à la liste de courses
                </Dialog.Title>
                <p className="text-ink-500 dark:text-ink-400 mt-2 text-sm/6">
                  {summary.addedCount} article
                  {summary.addedCount !== 1 ? 's' : ''} ajouté
                  {summary.addedCount !== 1 ? 's' : ''}
                  {summary.mergedCount > 0 &&
                    `, ${summary.mergedCount} fusionné${summary.mergedCount !== 1 ? 's' : ''}`}
                  .
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-control bg-forest shadow-soft hover:bg-forest-600 focus-visible:outline-forest dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 mt-6 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Terminé
                </button>
              </div>
            ) : (
              // ============================================================
              // Form state
              // ============================================================
              <>
                <Dialog.Title className="font-display text-ink text-lg font-semibold dark:text-white">
                  Ajouter à la liste de courses
                </Dialog.Title>
                <p className="text-ink-500 dark:text-ink-400 mt-2 text-sm/6">
                  Choisissez une liste, ajustez les portions et sélectionnez les
                  ingrédients à ajouter.
                </p>

                {/* Shopping list selector */}
                <div className="mt-5">
                  <label
                    htmlFor="shopping-list-select"
                    className="text-ink-700 dark:text-ink-300 block text-sm font-medium"
                  >
                    Liste de courses
                  </label>

                  {hasNoLists ? (
                    <div className="rounded-control border-sand-200 bg-sand-50 mt-2 border border-dashed p-4 text-center dark:border-white/10 dark:bg-white/[0.02]">
                      <ShoppingBagIcon
                        aria-hidden="true"
                        className="text-ink-300 dark:text-ink-400 mx-auto size-8"
                      />
                      <p className="text-ink-500 dark:text-ink-400 mt-2 text-sm/6">
                        Vous n&apos;avez pas encore de liste de courses.
                      </p>
                      <Link
                        to="/shopping-lists"
                        onClick={onClose}
                        className="rounded-control bg-forest shadow-soft hover:bg-forest-600 focus-visible:outline-forest dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        <PlusIcon aria-hidden="true" className="size-4" />
                        Créer une liste
                      </Link>
                    </div>
                  ) : (
                    <select
                      id="shopping-list-select"
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      disabled={listsLoading}
                      className="rounded-control border-sand-200 text-ink shadow-soft focus:border-forest-500 focus:outline-forest-600 dark:bg-ink-900 dark:focus:border-forest-400 dark:focus:outline-forest-500 mt-1.5 block w-full border bg-white px-3 py-2.5 text-sm focus:outline-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white"
                    >
                      <option value="">Sélectionner une liste…</option>
                      {(lists ?? []).map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Servings input */}
                <div className="mt-4">
                  <label
                    htmlFor="target-servings"
                    className="text-ink-700 dark:text-ink-300 block text-sm font-medium"
                  >
                    Portions
                  </label>
                  <input
                    id="target-servings"
                    type="number"
                    min="1"
                    step="1"
                    value={targetServings}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setTargetServings(
                        Number.isFinite(value) && value >= 1 ? value : 1,
                      )
                    }}
                    className="rounded-control border-sand-200 text-ink shadow-soft focus:border-forest-500 focus:outline-forest-600 dark:focus:border-forest-400 dark:focus:outline-forest-500 mt-1.5 block w-28 border bg-white px-3 py-2.5 text-sm focus:outline-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                {/* Ingredient selection */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-700 dark:text-ink-300 text-sm font-medium">
                      Ingrédients
                    </span>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-forest hover:text-forest-600 focus-visible:outline-forest dark:text-sage-400 dark:hover:text-sage-300 dark:focus-visible:outline-forest-500 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {selectedIngredientIds.size === allIngredientIds.length
                        ? 'Tout désélectionner'
                        : 'Tout sélectionner'}
                    </button>
                  </div>

                  <div className="rounded-control border-sand-200 mt-2 max-h-64 space-y-4 overflow-y-auto border p-3 dark:border-white/10">
                    {recipe.recipe_ingredient_groups.map((group) => (
                      <div key={group.id}>
                        {group.name && (
                          <h4 className="text-ink-400 dark:text-ink-500 mb-1.5 text-xs font-semibold tracking-wider uppercase">
                            {group.name}
                          </h4>
                        )}
                        <ul className="space-y-1" role="list">
                          {group.recipe_ingredients.map((ingredient) => {
                            const scaled = scaledIngredients.find(
                              (s) => s.id === ingredient.id,
                            )
                            const quantityText =
                              scaled?.quantity !== null &&
                              scaled?.quantity !== undefined
                                ? formatQuantity(scaled.quantity)
                                : ''
                            return (
                              <li key={ingredient.id}>
                                <label className="rounded-control hover:bg-sand-50 flex cursor-pointer items-center gap-3 px-2 py-1.5 text-sm transition-colors dark:hover:bg-white/5">
                                  <input
                                    type="checkbox"
                                    checked={selectedIngredientIds.has(
                                      ingredient.id,
                                    )}
                                    onChange={() =>
                                      toggleIngredient(ingredient.id)
                                    }
                                    className="border-sand-200 text-forest focus:ring-forest-500 dark:border-ink-700 dark:bg-ink-700 dark:ring-offset-ink-900 size-4 rounded"
                                  />
                                  <span className="text-ink min-w-[4.5rem] font-medium tabular-nums dark:text-white">
                                    {quantityText} {ingredient.unit ?? ''}
                                  </span>
                                  <span className="text-ink-700 dark:text-ink-300">
                                    {ingredient.name}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Added vs merged summary */}
                {selectedListId && (
                  <p className="text-ink-500 dark:text-ink-400 mt-3 text-sm">
                    {summary.addedCount} article
                    {summary.addedCount !== 1 ? 's' : ''}{' '}
                    {summary.addedCount !== 1 ? 'seront' : 'sera'} ajouté
                    {summary.addedCount !== 1 ? 's' : ''}
                    {summary.mergedCount > 0 &&
                      `, ${summary.mergedCount} fusionné${summary.mergedCount !== 1 ? 's' : ''} avec des articles existants`}
                    .
                  </p>
                )}

                {/* Error message */}
                {mutation.isError && (
                  <p
                    role="alert"
                    className="text-error dark:text-error-400 mt-3 flex items-center gap-1.5 text-sm"
                  >
                    <ExclamationTriangleIcon
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : 'Échec de l\u2019ajout des articles. Veuillez réessayer.'}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={mutation.isPending}
                    className="rounded-control border-sand-200 text-ink-700 shadow-soft hover:bg-sand-50 focus-visible:outline-forest-600 dark:text-ink-300 dark:focus-visible:outline-forest-500 inline-flex items-center justify-center border bg-white px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || mutation.isPending}
                    className="rounded-control bg-forest shadow-soft hover:bg-forest-600 focus-visible:outline-forest dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Ajout…
                      </>
                    ) : (
                      <>
                        <PlusIcon aria-hidden="true" className="size-4" />
                        Ajouter à la liste
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default AddToShoppingListModal
