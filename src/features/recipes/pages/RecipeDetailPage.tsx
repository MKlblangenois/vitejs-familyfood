import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  MinusIcon,
  PlusIcon,
  CakeIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
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
import Button from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import SharedEmptyState from '../../../shared/components/EmptyState'
import SharedErrorState from '../../../shared/components/ErrorState'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'

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
    <div className="inline-flex items-center gap-1 rounded-control bg-sand-100 p-1 dark:bg-white/5">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Diminuer les portions"
        className="flex size-8 items-center justify-center rounded-[10px] text-ink-600 transition-colors hover:bg-white hover:text-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
      >
        <MinusIcon aria-hidden="true" className="size-4" />
      </button>
      <span className="min-w-[3ch] text-center text-sm font-semibold text-ink dark:text-white">
        {servings}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Augmenter les portions"
        className="flex size-8 items-center justify-center rounded-[10px] text-ink-600 transition-colors hover:bg-white hover:text-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
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
        <h3 className="mb-4 font-display text-lg font-semibold text-ink dark:text-white">
          {group.name}
        </h3>
      )}
      <ul className="space-y-3" role="list">
        {group.recipe_ingredients.map((ingredient) => {
          const { quantity, unit } = scaleIngredient(
            ingredient,
            originalServings,
            targetServings,
          )
          return (
            <li
              key={ingredient.id}
              className="flex items-baseline gap-4 text-sm/6 text-ink-700 dark:text-ink-200 sm:text-base/7"
            >
              <span className="min-w-[5rem] font-medium text-ink tabular-nums dark:text-white">
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
    <ol className="space-y-6" role="list">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex gap-4 text-sm/6 text-ink-700 dark:text-ink-200 sm:text-base/7"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white dark:bg-forest-600">
            {index + 1}
          </span>
          <p className="pt-1">{step.instruction}</p>
        </li>
      ))}
    </ol>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-page">
        <LoadingSkeleton className="h-full w-full" />
      </div>
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-2/3" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-3/4" />
      </div>
      <div className="rounded-card border border-sand-200 p-6 dark:border-white/10">
        <LoadingSkeleton lines={4} />
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8">
      <SharedErrorState
        title="Impossible de charger la recette"
        description="Une erreur est survenue lors du chargement de cette recette. Vérifiez votre connexion et réessayez."
        onRetry={onRetry}
      />
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="py-8">
      <SharedEmptyState
        icon={<CakeIcon aria-hidden="true" className="size-7" />}
        title="Recette introuvable"
        description="Cette recette a peut-être été supprimée ou n'existe pas."
        action={
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 rounded-control bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Retour aux recettes
          </Link>
        }
      />
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

  const hasImage = !!recipe.image_url && !imageFailed

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/recipes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-sage-300 dark:hover:text-white dark:focus-visible:outline-forest-400"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Toutes les recettes
      </Link>

      {/* Hero image */}
      {hasImage && (
        <div className="relative mb-6 -mx-4 sm:mx-0 sm:overflow-hidden sm:rounded-page sm:shadow-card">
          <img
            src={recipe.image_url!}
            alt=""
            aria-hidden="true"
            onError={() => setImageFailed(true)}
            className="aspect-[16/9] w-full object-cover"
          />
          {/* Subtle top scrim to keep floating controls legible */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent sm:hidden"
          />
          {/* Mobile floating glass actions */}
          <div className="absolute right-3 top-3 flex items-center gap-2 sm:hidden">
            <Link
              to={`/recipes/${recipe.id}/edit`}
              aria-label="Modifier la recette"
              className="flex size-10 items-center justify-center rounded-pill border border-white/40 bg-white/70 text-ink shadow-float backdrop-blur transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:border-white/20 dark:bg-ink-900/70 dark:text-white dark:hover:bg-ink-900/90 dark:focus-visible:outline-forest-400"
            >
              <PencilIcon aria-hidden="true" className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              aria-label="Supprimer la recette"
              className="flex size-10 items-center justify-center rounded-pill border border-white/40 bg-white/70 text-error-600 shadow-float backdrop-blur transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 dark:border-white/20 dark:bg-ink-900/70 dark:text-error-400 dark:hover:bg-ink-900/90 dark:focus-visible:outline-error-400"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Title + description + desktop actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-3 text-base/7 text-ink-500 dark:text-ink-300">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Desktop action row */}
        <div
          className={`flex items-center gap-2 ${
            hasImage ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <Button
            variant="primary"
            size="sm"
            icon={<ShoppingBagIcon aria-hidden="true" className="size-4" />}
            onClick={() => setIsAddToListOpen(true)}
          >
            Ajouter à la liste de courses
          </Button>
          <Link
            to={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-control border border-sand-200 bg-cream px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-forest-400"
          >
            <PencilIcon aria-hidden="true" className="size-4" />
            Modifier
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-control border border-error-200 bg-cream px-3 py-1.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 dark:border-error-500/20 dark:bg-white/5 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-400"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Meta: time + servings */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-sand-200 bg-cream px-5 py-4 dark:border-white/10 dark:bg-white/5">
        {recipe.prep_time_minutes !== null &&
          recipe.prep_time_minutes > 0 && (
            <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
              <ClockIcon
                aria-hidden="true"
                className="size-4 text-sage-500 dark:text-sage-400"
              />
              Préparation : {formatTime(recipe.prep_time_minutes)}
            </div>
          )}
        {recipe.cook_time_minutes !== null &&
          recipe.cook_time_minutes > 0 && (
            <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
              <ClockIcon
                aria-hidden="true"
                className="size-4 text-sage-500 dark:text-sage-400"
              />
              Cuisson : {formatTime(recipe.cook_time_minutes)}
            </div>
          )}
        {totalMinutes && (
          <div className="flex items-center gap-2 text-sm font-medium text-ink dark:text-white">
            <ClockIcon
              aria-hidden="true"
              className="size-4 text-forest-600 dark:text-forest-400"
            />
            Total : {totalMinutes}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
            <UsersIcon
              aria-hidden="true"
              className="size-4 text-sage-500 dark:text-sage-400"
            />
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
        <section aria-labelledby="ingredients-heading" className="mb-10">
          <h2
            id="ingredients-heading"
            className="mb-5 font-display text-2xl font-bold text-ink dark:text-white"
          >
            Ingrédients
          </h2>
          <div className="space-y-8 rounded-card border border-sand-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-forest-900 sm:p-8">
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
        <section aria-labelledby="steps-heading" className="mb-10">
          <h2
            id="steps-heading"
            className="mb-5 font-display text-2xl font-bold text-ink dark:text-white"
          >
            Instructions
          </h2>
          <div className="rounded-card border border-sand-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-forest-900 sm:p-8">
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
      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Supprimer la recette ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
              icon={<TrashIcon aria-hidden="true" className="size-4" />}
            >
              Supprimer la recette
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/10">
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="size-5 text-error-600 dark:text-error-400"
            />
          </div>
          <p className="text-sm/6 text-ink-600 dark:text-ink-300">
            Voulez-vous vraiment supprimer « {recipe.title} » ? Cette action
            est irréversible.
          </p>
        </div>
      </Modal>

      {/* Mobile FAB — add to shopping list */}
      <button
        type="button"
        onClick={() => setIsAddToListOpen(true)}
        aria-label="Ajouter à la liste de courses"
        className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-forest text-white shadow-float transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 sm:hidden dark:bg-forest-600 dark:focus-visible:outline-forest-400"
      >
        <ShoppingBagIcon aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}

export default RecipeDetailPage
