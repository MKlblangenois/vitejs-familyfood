import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  CakeIcon,
} from '@heroicons/react/24/outline'
import { useRecipes } from '../hooks'
import type { Recipe } from '../types'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'
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

function totalTime(recipe: Recipe): string | null {
  const total =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
  return total > 0 ? formatTime(total) : null
}

// ============================================================
// Sub-components
// ============================================================

function RecipeImage({
  recipe,
  className,
  iconClassName,
}: {
  recipe: Recipe
  className: string
  iconClassName: string
}) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-sand-100 dark:bg-white/5 ${className}`}>
      {recipe.image_url && !imageFailed ? (
        <img
          src={recipe.image_url}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <CakeIcon aria-hidden="true" className={iconClassName} />
        </div>
      )}
    </div>
  )
}

function FeaturedRecipeCard({ recipe }: { recipe: Recipe }) {
  const time = totalTime(recipe)

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-page border border-sand-200 bg-white shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:border-white/10 dark:bg-forest-900 dark:focus-visible:outline-forest-400 sm:flex-row"
    >
      <RecipeImage
        recipe={recipe}
        className="aspect-[16/10] w-full sm:aspect-auto sm:w-3/5"
        iconClassName="size-16 text-sand-300 dark:text-white/20"
      />

      <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
          {recipe.title}
        </h2>

        {recipe.description && (
          <p className="line-clamp-2 text-sm/6 text-ink-500 dark:text-ink-300 sm:text-base/7">
            {recipe.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-600 dark:text-ink-300">
          {recipe.servings > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon aria-hidden="true" className="size-4" />
              {recipe.servings} portion{recipe.servings !== 1 ? 's' : ''}
            </span>
          )}
          {time && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon aria-hidden="true" className="size-4" />
              {time}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function CompactRecipeCard({ recipe }: { recipe: Recipe }) {
  const time = totalTime(recipe)

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-sand-200 bg-white shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:border-white/10 dark:bg-forest-900 dark:focus-visible:outline-forest-400"
    >
      <RecipeImage
        recipe={recipe}
        className="aspect-[16/9] w-full"
        iconClassName="size-12 text-sand-300 dark:text-white/20"
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="line-clamp-2 text-sm/6 text-ink-500 dark:text-ink-300">
            {recipe.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-ink-600 dark:text-ink-300">
          {recipe.servings > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon aria-hidden="true" className="size-4" />
              {recipe.servings} portion{recipe.servings !== 1 ? 's' : ''}
            </span>
          )}
          {time && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon aria-hidden="true" className="size-4" />
              {time}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function RecipesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Featured skeleton */}
      <div className="overflow-hidden rounded-page border border-sand-200 bg-white dark:border-white/10 dark:bg-forest-900">
        <div className="aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9]">
          <LoadingSkeleton className="h-full w-full" />
        </div>
        <div className="space-y-3 p-6 sm:p-10">
          <LoadingSkeleton className="h-7 w-2/3" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Compact skeletons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-card border border-sand-200 bg-white dark:border-white/10 dark:bg-forest-900"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <LoadingSkeleton className="h-full w-full" />
            </div>
            <div className="space-y-3 p-5">
              <LoadingSkeleton className="h-5 w-3/4" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const RecipesPage = () => {
  const { data: recipes, isLoading, isError, refetch } = useRecipes()
  const [search, setSearch] = useState('')

  const filteredRecipes = useMemo(() => {
    if (!recipes) return []
    if (!search.trim()) return recipes
    const query = search.trim().toLowerCase()
    return recipes.filter((r) => r.title.toLowerCase().includes(query))
  }, [recipes, search])

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
          Recettes
        </h1>

        <Link
          to="/recipes/new"
          className="inline-flex items-center justify-center gap-2 rounded-control bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
        >
          <PlusIcon aria-hidden="true" className="size-5" />
          Nouvelle recette
        </Link>
      </div>

      {/* Search — only show when there are recipes or loading */}
      {!isError && (
        <div className="relative mb-8">
          <label htmlFor="recipe-search" className="sr-only">
            Rechercher des recettes
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400 dark:text-ink-300"
          />
          <input
            id="recipe-search"
            type="text"
            placeholder="Rechercher des recettes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-control border border-sand-200 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:outline-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:outline-forest-400"
          />
        </div>
      )}

      {/* Content */}
      {isLoading && <RecipesLoadingSkeleton />}

      {isError && (
        <ErrorState
          title="Une erreur est survenue"
          description="Nous n'avons pas pu charger vos recettes. Veuillez vérifier votre connexion et réessayer."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filteredRecipes.length === 0 && (
        <EmptyState
          icon={<CakeIcon aria-hidden="true" className="size-7" />}
          title="Aucune recette pour le moment"
          description="Commencez à constituer votre collection de recettes personnelles. Ajoutez votre première recette et elle apparaîtra ici."
          action={
            <Link
              to="/recipes/new"
              className="inline-flex items-center justify-center gap-2 rounded-control bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
            >
              <PlusIcon aria-hidden="true" className="size-5" />
              Créer votre première recette
            </Link>
          }
        />
      )}

      {!isLoading && !isError && filteredRecipes.length > 0 && (
        <div className="space-y-6">
          <FeaturedRecipeCard recipe={filteredRecipes[0]} />
          {filteredRecipes.length > 1 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.slice(1).map((recipe) => (
                <CompactRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results for search (recipes exist but filter yielded nothing) */}
      {!isLoading &&
        !isError &&
        recipes &&
        recipes.length > 0 &&
        filteredRecipes.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-ink-300">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="mt-4 text-sm/6 text-ink-500 dark:text-ink-300">
              Aucune recette ne correspond à « {search} »
            </p>
          </div>
        )}

      {/* Mobile FAB */}
      <Link
        to="/recipes/new"
        aria-label="Nouvelle recette"
        className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-forest text-white shadow-float transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 sm:hidden dark:bg-forest-600 dark:focus-visible:outline-forest-400"
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </Link>
    </div>
  )
}

export default RecipesPage
