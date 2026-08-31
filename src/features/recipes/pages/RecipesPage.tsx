import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CakeIcon,
} from '@heroicons/react/24/outline'
import { useRecipes } from '../hooks'
import type { Recipe } from '../types'

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

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const time = totalTime(recipe)

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-200 transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-800 dark:ring-white/10 dark:hover:shadow-none dark:focus-visible:outline-indigo-500"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CakeIcon
              aria-hidden="true"
              className="size-12 text-gray-300 dark:text-gray-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="line-clamp-2 text-sm/6 text-gray-500 dark:text-gray-400">
            {recipe.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-gray-400 dark:text-gray-500">
          {recipe.servings > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon aria-hidden="true" className="size-4" />
              {recipe.servings} servings
            </span>
          )}
          {time && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon aria-hidden="true" className="size-4" />
              {time}
            </span>
          )}
          {recipe.prep_time_minutes !== null &&
            recipe.cook_time_minutes !== null &&
            recipe.prep_time_minutes + recipe.cook_time_minutes > 0 && (
              <span className="ml-auto text-gray-300 dark:text-gray-600">
                prep {formatTime(recipe.prep_time_minutes) ?? '—'} / cook{' '}
                {formatTime(recipe.cook_time_minutes) ?? '—'}
              </span>
            )}
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
          <div className="aspect-[4/3] animate-pulse bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-600" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-600" />
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
        We couldn't load your recipes. Please check your connection and try
        again.
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

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
        <CakeIcon
          aria-hidden="true"
          className="size-12 text-indigo-600 dark:text-indigo-400"
        />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-gray-900 dark:text-white">
        No recipes yet
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-gray-500 dark:text-gray-400">
        Start building your personal recipe collection. Add your first recipe
        and it'll show up here.
      </p>
      <Link
        to="/recipes/new"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
      >
        <PlusIcon aria-hidden="true" className="size-5" />
        Create your first recipe
      </Link>
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Recipes
        </h1>

        <Link
          to="/recipes/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
        >
          <PlusIcon aria-hidden="true" className="size-5" />
          New Recipe
        </Link>
      </div>

      {/* Search — only show when there are recipes or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="recipe-search" className="sr-only">
            Search recipes
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            id="recipe-search"
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:outline-indigo-500"
          />
        </div>
      )}

      {/* Content */}
      {isLoading && <LoadingSkeleton />}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && filteredRecipes.length === 0 && (
        <EmptyState />
      )}

      {!isLoading && !isError && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* No results for search (recipes exist but filter yielded nothing) */}
      {!isLoading &&
        !isError &&
        recipes &&
        recipes.length > 0 &&
        filteredRecipes.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="size-10 text-gray-300 dark:text-gray-600"
            />
            <p className="mt-4 text-sm/6 text-gray-500 dark:text-gray-400">
              No recipes match "{search}"
            </p>
          </div>
        )}

      {/* Mobile FAB */}
      <Link
        to="/recipes/new"
        aria-label="New Recipe"
        className="fixed bottom-20 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:hidden dark:bg-indigo-500 dark:focus-visible:outline-indigo-400"
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </Link>
    </div>
  )
}

export default RecipesPage
