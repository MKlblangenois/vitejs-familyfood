import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  CakeIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline'
import { useRecipes } from '../hooks'
import type { Recipe } from '../types'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'
import BrandMark from '../../../shared/components/BrandMark'

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

export function RecipeImage({
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
    <div
      className={`bg-sand-100 relative overflow-hidden dark:bg-white/5 ${className}`}
    >
      {recipe.image_url && !imageFailed ? (
        <img
          src={recipe.image_url}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          className="recipe-image-hover h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <CakeIcon aria-hidden="true" className={iconClassName} />
        </div>
      )}
    </div>
  )
}

function RecipeCard({
  recipe,
  featured = false,
}: {
  recipe: Recipe
  featured?: boolean
}) {
  const time = totalTime(recipe)
  const location = useLocation()

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      state={{ backgroundLocation: location }}
      className="group rounded-card focus-visible:outline-forest-600 dark:focus-visible:outline-forest-400 block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative">
        <RecipeImage
          recipe={recipe}
          className={
            featured
              ? 'rounded-card aspect-[16/11] w-full sm:aspect-[16/10]'
              : 'rounded-card aspect-[4/3] w-full'
          }
          iconClassName={
            featured
              ? 'size-16 text-sand-300 dark:text-white/20'
              : 'size-12 text-sand-300 dark:text-white/20'
          }
        />
        <span className="text-forest shadow-soft dark:bg-ink-900/90 absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-full bg-white/90 dark:text-white">
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div className="pt-4">
        {recipe.description && (
          <p className="text-ink-500 dark:text-ink-300 line-clamp-1 text-xs">
            {recipe.description}
          </p>
        )}
        <h3
          className={`font-display text-ink mt-1.5 font-medium dark:text-white ${featured ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
        >
          {recipe.title}
        </h3>
        <div className="text-ink-600 dark:text-ink-300 mt-2 flex flex-wrap items-center gap-3 text-xs">
          {time && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon aria-hidden="true" className="size-4" />
              {time}
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon aria-hidden="true" className="size-4" />
              {recipe.servings} portion{recipe.servings !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function FeaturedRecipeCard({ recipe }: { recipe: Recipe }) {
  return <RecipeCard recipe={recipe} featured />
}

export function CompactRecipeCard({ recipe }: { recipe: Recipe }) {
  return <RecipeCard recipe={recipe} />
}

function RecipesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Featured skeleton */}
      <div className="rounded-page border-sand-200 dark:bg-forest-900 overflow-hidden border bg-white dark:border-white/10">
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
            className="rounded-card border-sand-200 dark:bg-forest-900 overflow-hidden border bg-white dark:border-white/10"
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
      <header className="relative mb-8 overflow-hidden pt-14 sm:mb-12 sm:pt-16">
        <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
          Votre carnet de cuisine
        </p>
        <h1 className="font-display text-forest dark:text-cream relative z-10 mt-5 max-w-2xl max-w-[13ch] text-[clamp(2.8rem,8vw,4.75rem)] leading-[1.08] font-medium tracking-[-0.04em]">
          <span className="sr-only">Recettes : </span>De bonnes choses
          <br />
          <span className="text-sage-400 dark:text-sage-300 font-normal italic">
            à partager.
          </span>
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-5 max-w-md text-sm/6 sm:text-base">
          Les recettes qu’on aime, réunies au même endroit.
        </p>
        <BrandMark className="text-sage-100 pointer-events-none absolute top-14 right-0 size-14 sm:top-16 sm:right-8 sm:size-28 dark:text-white/10" />
        <Link
          to="/recipes/new"
          className="rounded-control bg-forest hover:bg-forest-700 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <PlusIcon aria-hidden="true" className="size-5" />
          Nouvelle recette
        </Link>
      </header>

      {/* Search — only show when there are recipes or loading */}
      {!isError && (
        <div className="relative mb-8">
          <label htmlFor="recipe-search" className="sr-only">
            Rechercher des recettes
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="text-ink-400 dark:text-ink-300 pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            id="recipe-search"
            type="text"
            placeholder="Rechercher des recettes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:outline-forest-400 block w-full border bg-white py-3 pr-4 pl-11 text-sm focus:outline-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
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

      {!isLoading && !isError && recipes?.length === 0 && (
        <EmptyState
          icon={<CakeIcon aria-hidden="true" className="size-7" />}
          title="Aucune recette pour le moment"
          description="Commencez à constituer votre collection de recettes personnelles. Ajoutez votre première recette et elle apparaîtra ici."
          action={
            <Link
              to="/recipes/new"
              className="rounded-control bg-forest hover:bg-forest-700 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <PlusIcon aria-hidden="true" className="size-5" />
              Créer votre première recette
            </Link>
          }
        />
      )}

      {!isLoading && !isError && filteredRecipes.length > 0 && (
        <section aria-labelledby="recipes-heading">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
                À la une
              </p>
              <h2
                id="recipes-heading"
                className="font-display text-ink mt-2 text-2xl font-medium tracking-tight sm:text-3xl dark:text-white"
              >
                Une idée pour aujourd’hui
              </h2>
            </div>
            <span className="text-ink-500 dark:text-ink-300 hidden text-xs sm:block">
              Le plaisir de cuisiner ensemble
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-6">
            <div className="col-span-2 sm:row-span-2">
              <FeaturedRecipeCard recipe={filteredRecipes[0]} />
            </div>
            {filteredRecipes.slice(1).map((recipe) => (
              <CompactRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* No results for search (recipes exist but filter yielded nothing) */}
      {!isLoading &&
        !isError &&
        recipes &&
        recipes.length > 0 &&
        filteredRecipes.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <div className="bg-sand-100 text-ink-400 dark:text-ink-300 flex size-14 items-center justify-center rounded-full dark:bg-white/10">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="text-ink-500 dark:text-ink-300 mt-4 text-sm/6">
              Aucune recette ne correspond à « {search} »
            </p>
          </div>
        )}

      <Link
        to="/recipes/new"
        aria-label="Nouvelle recette"
        className="bg-forest shadow-float active:bg-forest-700 focus-visible:outline-forest-600 dark:bg-forest-600 dark:focus-visible:outline-forest-400 fixed right-5 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] z-30 flex size-14 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </Link>
    </div>
  )
}

export default RecipesPage
