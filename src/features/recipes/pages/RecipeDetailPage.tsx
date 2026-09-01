import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MinusIcon,
  PlusIcon,
  CakeIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useRecipe, useDeleteRecipe } from '../hooks'
import AddToShoppingListModal from '../components/AddToShoppingListModal'
import { deleteRecipeImage, extractStoragePath } from '../lib/imageUpload'
import {
  getScaleFactor,
  scaleQuantity,
  formatQuantity,
} from '../lib/servingScaling'
import type {
  RecipeWithRelations,
  RecipeIngredientGroup,
  RecipeIngredient,
} from '../types'

// ============================================================
// Helpers
// ============================================================

function formatTime(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function scaleIngredient(
  ingredient: RecipeIngredient,
  originalServings: number,
  targetServings: number,
): { quantity: string; unit: string } {
  const factor = getScaleFactor(targetServings, originalServings)
  const scaled =
    ingredient.quantity !== null
      ? scaleQuantity(ingredient.quantity, factor)
      : null
  return {
    quantity: scaled !== null ? formatQuantity(scaled) : '',
    unit: ingredient.unit ?? '',
  }
}

// ============================================================
// Sub-components
// ============================================================

function ServingsStepper({
  servings,
  onDecrement,
  onIncrement,
}: {
  servings: number
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Diminuer les portions"
        className="flex size-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-400 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
      >
        <MinusIcon aria-hidden="true" className="size-4" />
      </button>
      <span className="min-w-[3ch] text-center text-sm font-semibold text-gray-900 dark:text-white">
        {servings}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Augmenter les portions"
        className="flex size-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-400 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function IngredientGroupSection({
  group,
  originalServings,
  targetServings,
}: {
  group: RecipeIngredientGroup & { recipe_ingredients: RecipeIngredient[] }
  originalServings: number
  targetServings: number
}) {
  return (
    <div>
      {group.name && (
        <h3 className="mb-3 font-display text-base font-semibold text-gray-900 dark:text-white">
          {group.name}
        </h3>
      )}
      <ul className="space-y-2" role="list">
        {group.recipe_ingredients.map((ingredient) => {
          const { quantity, unit } = scaleIngredient(
            ingredient,
            originalServings,
            targetServings,
          )
          return (
            <li
              key={ingredient.id}
              className="flex items-baseline gap-3 text-sm/6 text-gray-700 dark:text-gray-300"
            >
              <span className="min-w-[4.5rem] font-medium text-gray-900 tabular-nums dark:text-white">
                {quantity} {unit}
              </span>
              <span>{ingredient.name}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StepList({ steps }: { steps: RecipeWithRelations['recipe_steps'] }) {
  return (
    <ol className="space-y-4" role="list">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex gap-4 text-sm/6 text-gray-700 dark:text-gray-300"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white dark:bg-indigo-500">
            {index + 1}
          </span>
          <p className="pt-0.5">{step.instruction}</p>
        </li>
      ))}
    </ol>
  )
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="aspect-[16/9] rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-600" />
      <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-600" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-gray-100 dark:bg-gray-600"
            style={{ width: `${85 - i * 10}%` }}
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
        Impossible de charger la recette
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Une erreur est survenue lors du chargement de cette recette. Vérifiez
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
      <CakeIcon
        aria-hidden="true"
        className="size-16 text-gray-300 dark:text-gray-600"
      />
      <h2 className="mt-6 font-display text-2xl font-bold text-gray-900 dark:text-white">
        Recette introuvable
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Cette recette a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/recipes"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Retour aux recettes
      </Link>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    data: recipe,
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useRecipe(id ?? '')
  const deleteMutation = useDeleteRecipe()

  const [targetServings, setTargetServings] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isAddToListOpen, setIsAddToListOpen] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const originalServings = recipe?.servings ?? 1
  const currentServings = targetServings ?? originalServings

  const handleDecrement = useCallback(() => {
    setTargetServings((prev) => {
      const current = prev ?? originalServings
      return Math.max(1, current - 1)
    })
  }, [originalServings])

  const handleIncrement = useCallback(() => {
    setTargetServings((prev) => {
      const current = prev ?? originalServings
      return current + 1
    })
  }, [originalServings])

  const handleDelete = useCallback(() => {
    if (!id) return

    // Best-effort delete the recipe image from storage (ignore failures).
    if (recipe?.image_url) {
      const imagePath = extractStoragePath(recipe.image_url)
      if (imagePath) {
        void deleteRecipeImage(imagePath).catch(() => {
          // Best-effort: log and continue.
          console.error('[Tablee] Failed to delete recipe image', imagePath)
        })
      }
    }

    deleteMutation.mutate(id, {
      onSuccess: () => {
        setIsDeleteOpen(false)
        void navigate('/recipes')
      },
    })
  }, [id, recipe, deleteMutation, navigate])

  const totalMinutes = useMemo(() => {
    if (!recipe) return null
    const total =
      (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
    return total > 0 ? formatTime(total) : null
  }, [recipe])

  if (!id) return <NotFoundState />
  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isFetched && !recipe) return <NotFoundState />
  if (!recipe) return null

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/recipes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Toutes les recettes
      </Link>

      {/* Hero image */}
      {recipe.image_url && !imageFailed && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={recipe.image_url}
            alt=""
            aria-hidden="true"
            onError={() => setImageFailed(true)}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      {/* Title + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddToListOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
          >
            <ShoppingBagIcon aria-hidden="true" className="size-4" />
            Ajouter à la liste de courses
          </button>
          <Link
            to={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
          >
            <PencilIcon aria-hidden="true" className="size-4" />
            Modifier
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-red-500/20 dark:bg-white/5 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:outline-red-500"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Meta: time + servings */}
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
        {recipe.prep_time_minutes !== null &&
          recipe.prep_time_minutes > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon aria-hidden="true" className="size-4 text-gray-400 dark:text-gray-500" />
              Préparation : {formatTime(recipe.prep_time_minutes)}
            </div>
          )}
        {recipe.cook_time_minutes !== null &&
          recipe.cook_time_minutes > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon aria-hidden="true" className="size-4 text-gray-400 dark:text-gray-500" />
              Cuisson : {formatTime(recipe.cook_time_minutes)}
            </div>
          )}
        {totalMinutes && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
            <ClockIcon aria-hidden="true" className="size-4 text-indigo-600 dark:text-indigo-400" />
            Total : {totalMinutes}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <UsersIcon aria-hidden="true" className="size-4 text-gray-400 dark:text-gray-500" />
            Portions
          </div>
          <ServingsStepper
            servings={currentServings}
            onDecrement={handleDecrement}
            onIncrement={handleIncrement}
          />
        </div>
      </div>

      {/* Ingredient groups */}
      {recipe.recipe_ingredient_groups.length > 0 && (
        <section aria-labelledby="ingredients-heading" className="mb-8">
          <h2
            id="ingredients-heading"
            className="mb-4 font-display text-xl font-bold text-gray-900 dark:text-white"
          >
            Ingrédients
          </h2>
          <div className="space-y-6 rounded-lg border border-gray-200 p-4 dark:border-white/10">
            {recipe.recipe_ingredient_groups.map((group) => (
              <IngredientGroupSection
                key={group.id}
                group={group}
                originalServings={originalServings}
                targetServings={currentServings}
              />
            ))}
          </div>
        </section>
      )}

      {/* Steps */}
      {recipe.recipe_steps.length > 0 && (
        <section aria-labelledby="steps-heading" className="mb-8">
          <h2
            id="steps-heading"
            className="mb-4 font-display text-xl font-bold text-gray-900 dark:text-white"
          >
            Instructions
          </h2>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
            <StepList steps={recipe.recipe_steps} />
          </div>
        </section>
      )}

      {/* Add to shopping list dialog */}
      <AddToShoppingListModal
        open={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        recipe={recipe}
        initialServings={currentServings}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
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
                    Supprimer la recette ?
                  </DialogTitle>
                  <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                    Voulez-vous vraiment supprimer « {recipe.title} » ? Cette
                    action est irréversible.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
                >
                  Annuler
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
                      Suppression…
                    </>
                  ) : (
                    <>
                      <TrashIcon aria-hidden="true" className="size-4" />
                      Supprimer la recette
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

export default RecipeDetailPage
