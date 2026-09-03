import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { TextInput } from '../../../shared/components/TextInput'
import TextField from '../../../shared/components/TextField'
import SelectField from '../../../shared/components/SelectField'
import TextareaField from '../../../shared/components/TextareaField'
import Button from '../../../shared/components/Button'
import Card from '../../../shared/components/Card'
import { useRecipe, useUpdateRecipe } from '../hooks'
import RecipeImageUpload from '../components/RecipeImageUpload'
import { deleteRecipeImage, extractStoragePath } from '../lib/imageUpload'
import type { RecipeWithRelations, UpdateRecipeInput } from '../types'

// ============================================================
// Constants
// ============================================================

const CANONICAL_UNITS = [
  'tsp',
  'tbsp',
  'cup',
  'g',
  'kg',
  'ml',
  'l',
  'oz',
  'lb',
  'piece',
  'clove',
  'pinch',
  'to taste',
] as const

// ============================================================
// Zod schema — identical to the create form's validation.
// ============================================================

const recipeFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  servings: z.number().min(1, 'Doit être au moins 1'),
  prep_time_minutes: z.number().min(0, 'Doit être au moins 0').optional(),
  cook_time_minutes: z.number().min(0, 'Doit être au moins 0').optional(),
  image_url: z.string().optional(),
  ingredient_groups: z
    .array(
      z.object({
        name: z.string().min(1, 'Le nom du groupe est requis'),
        ingredients: z
          .array(
            z.object({
              name: z.string().min(1, 'Le nom de l’ingrédient est requis'),
              quantity: z.number().min(0, 'Doit être au moins 0'),
              unit: z.string().optional(),
            }),
          )
          .min(1, 'Ajoutez au moins un ingrédient'),
      }),
    )
    .min(1, 'Ajoutez au moins un groupe d’ingrédients'),
  steps: z.array(
    z.object({
      instruction: z.string().min(1, 'L’instruction de l’étape est requise'),
    }),
  ),
})

type RecipeFormValues = z.infer<typeof recipeFormSchema>

// ============================================================
// Helpers
// ============================================================

/**
 * Convert the server-side `RecipeWithRelations` shape into flat form values
 * that react-hook-form expects.
 *
 * Key mapping:
 * - `recipe_ingredient_groups[].recipe_ingredients[]` → `ingredient_groups[].ingredients[]`
 * - `recipe_steps[]` → `steps[]`
 * - Null fields get sensible defaults for the form (0 for quantity, '' for unit/name).
 */
function recipeToFormValues(recipe: RecipeWithRelations): RecipeFormValues {
  const sortedGroups = [...recipe.recipe_ingredient_groups].sort(
    (a, b) => a.position - b.position,
  )

  return {
    title: recipe.title,
    description: recipe.description ?? '',
    servings: recipe.servings,
    prep_time_minutes: recipe.prep_time_minutes ?? undefined,
    cook_time_minutes: recipe.cook_time_minutes ?? undefined,
    image_url: recipe.image_url ?? '',
    ingredient_groups:
      sortedGroups.length > 0
        ? sortedGroups.map((group) => ({
            name: group.name,
            ingredients: [...group.recipe_ingredients]
              .sort((a, b) => a.position - b.position)
              .map((ing) => ({
                name: ing.name,
                quantity: ing.quantity ?? 0,
                unit: ing.unit ?? '',
              })),
          }))
        : [{ name: '', ingredients: [{ name: '', quantity: 0, unit: '' }] }],
    steps: recipe.recipe_steps
      .sort((a, b) => a.position - b.position)
      .map((step) => ({ instruction: step.instruction })),
  }
}

/**
 * Convert validated form values into `UpdateRecipeInput`.
 * Since the form always submits full arrays, we pass them explicitly
 * (not undefined) so the update replaces all groups/steps.
 */
function toUpdateRecipeInput(
  recipeId: string,
  values: RecipeFormValues,
): UpdateRecipeInput {
  return {
    id: recipeId,
    title: values.title,
    description: values.description || null,
    image_url: values.image_url || null,
    servings: values.servings,
    prep_time_minutes: Number.isFinite(values.prep_time_minutes)
      ? values.prep_time_minutes
      : null,
    cook_time_minutes: Number.isFinite(values.cook_time_minutes)
      ? values.cook_time_minutes
      : null,
    ingredient_groups: values.ingredient_groups.map((group, gIdx) => ({
      name: group.name,
      position: gIdx,
      ingredients: group.ingredients.map((ing, iIdx) => ({
        name: ing.name,
        quantity: ing.quantity || null,
        unit: ing.unit || null,
        position: iIdx,
      })),
    })),
    steps: values.steps.map((step, sIdx) => ({
      instruction: step.instruction,
      position: sIdx,
    })),
  }
}

function toFormErrors(
  issues: z.ZodIssue[],
): Record<string, { message: string }> {
  const errors: Record<string, { message: string }> = {}
  for (const issue of issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = { message: issue.message }
    }
  }
  return errors
}

// ============================================================
// IngredientGroupCard — sub-component
// ============================================================

function IngredientGroupCard({
  groupIdx,
  control,
  register,
  formErrors,
  onRemoveGroup,
  isOnlyGroup,
}: {
  groupIdx: number
  control: ReturnType<typeof useForm<RecipeFormValues>>['control']
  register: ReturnType<typeof useForm<RecipeFormValues>>['register']
  formErrors: ReturnType<
    typeof useForm<RecipeFormValues>
  >['formState']['errors']
  onRemoveGroup: () => void
  isOnlyGroup: boolean
}) {
  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: `ingredient_groups.${groupIdx}.ingredients`,
  })

  const groupError = formErrors.ingredient_groups?.[groupIdx]

  return (
    <Card className="p-5">
      {/* Group header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1">
          <TextInput
            id={`group-name-${groupIdx}`}
            label="Nom du groupe"
            placeholder="p. ex. Pâte, Garnitures, Sauce"
            error={groupError?.name?.message}
            required
            {...register(`ingredient_groups.${groupIdx}.name`)}
          />
        </div>
        {!isOnlyGroup && (
          <button
            type="button"
            onClick={onRemoveGroup}
            className="rounded-control text-error hover:bg-error-50 focus-visible:outline-error-600 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-400 mt-6 inline-flex items-center justify-center p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Supprimer le groupe d’ingrédients ${groupIdx + 1}`}
          >
            <TrashIcon aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      {groupError?.ingredients?.message && (
        <p role="alert" className="text-error dark:text-error-400 mb-3 text-sm">
          {groupError.ingredients.message}
        </p>
      )}

      {/* Ingredients list */}
      <div className="space-y-3">
        {ingredientFields.map((ingField, ingIdx) => {
          const ingError = groupError?.ingredients?.[ingIdx]
          return (
            <div key={ingField.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextInput
                  id={`ing-name-${groupIdx}-${ingIdx}`}
                  label={ingIdx === 0 ? 'Nom' : undefined}
                  placeholder="Nom de l’ingrédient"
                  error={ingError?.name?.message}
                  required
                  {...register(
                    `ingredient_groups.${groupIdx}.ingredients.${ingIdx}.name`,
                  )}
                />
              </div>
              <div className="w-24 shrink-0">
                <TextInput
                  id={`ing-qty-${groupIdx}-${ingIdx}`}
                  label={ingIdx === 0 ? 'Qté' : undefined}
                  type="number"
                  placeholder="0"
                  min={0}
                  step="any"
                  error={ingError?.quantity?.message}
                  {...register(
                    `ingredient_groups.${groupIdx}.ingredients.${ingIdx}.quantity`,
                    { valueAsNumber: true },
                  )}
                />
              </div>
              <div className="w-28 shrink-0">
                <SelectField
                  id={`ing-unit-${groupIdx}-${ingIdx}`}
                  label={ingIdx === 0 ? 'Unité' : undefined}
                  {...register(
                    `ingredient_groups.${groupIdx}.ingredients.${ingIdx}.unit`,
                  )}
                >
                  <option value="">—</option>
                  {CANONICAL_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </SelectField>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(ingIdx)}
                aria-label={`Supprimer l’ingrédient ${ingIdx + 1}`}
                className="rounded-control text-error hover:bg-error-50 focus-visible:outline-error-600 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-400 mb-0.5 inline-flex shrink-0 items-center justify-center p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <XMarkIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => appendIngredient({ name: '', quantity: 0, unit: '' })}
        className="text-sage-600 hover:text-sage-700 focus-visible:outline-forest-600 dark:text-sage-300 dark:hover:text-sage-200 dark:focus-visible:outline-forest-400 mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <PlusIcon aria-hidden="true" className="size-3.5" />
        Ajouter un ingrédient
      </button>
    </Card>
  )
}

// ============================================================
// StepsSection — sub-component
// ============================================================

function StepsSection({
  control,
  register,
  formErrors,
}: {
  control: ReturnType<typeof useForm<RecipeFormValues>>['control']
  register: ReturnType<typeof useForm<RecipeFormValues>>['register']
  formErrors: ReturnType<
    typeof useForm<RecipeFormValues>
  >['formState']['errors']
}) {
  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'steps',
  })

  return (
    <section aria-labelledby="steps-heading">
      <h2
        id="steps-heading"
        className="font-display text-ink mb-4 text-lg font-semibold dark:text-white"
      >
        Étapes
      </h2>

      <div className="space-y-3">
        {stepFields.map((stepField, stepIdx) => {
          const stepError = formErrors.steps?.[stepIdx]
          return (
            <div key={stepField.id} className="flex items-start gap-3">
              <span className="bg-forest dark:bg-forest-500 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {stepIdx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor={`step-${stepIdx}`} className="sr-only">
                  Étape {stepIdx + 1}
                </label>
                <textarea
                  id={`step-${stepIdx}`}
                  rows={2}
                  placeholder={`Décrivez l’étape ${stepIdx + 1}…`}
                  aria-describedby={
                    stepError?.instruction?.message
                      ? `step-${stepIdx}-error`
                      : undefined
                  }
                  aria-invalid={
                    stepError?.instruction?.message ? 'true' : undefined
                  }
                  {...register(`steps.${stepIdx}.instruction`)}
                  className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-400 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 block w-full border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {stepError?.instruction?.message && (
                  <p
                    id={`step-${stepIdx}-error`}
                    role="alert"
                    className="text-error dark:text-error-400 mt-1 text-sm"
                  >
                    {stepError.instruction.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeStep(stepIdx)}
                aria-label={`Supprimer l’étape ${stepIdx + 1}`}
                className="rounded-control text-error hover:bg-error-50 focus-visible:outline-error-600 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-400 mt-1 inline-flex shrink-0 items-center justify-center p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <XMarkIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => appendStep({ instruction: '' })}
        className="rounded-card border-sand-200 text-ink-600 hover:border-sage hover:text-sage focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:border-sage-400 dark:hover:text-sage-300 dark:focus-visible:outline-forest-400 mt-4 inline-flex items-center gap-2 border border-dashed px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
        Ajouter une étape
      </button>
    </section>
  )
}

// ============================================================
// Loading state
// ============================================================

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-sand-200 dark:bg-ink-700 h-4 w-24 rounded" />
      <div className="bg-sand-200 dark:bg-ink-700 h-8 w-1/2 rounded" />
      <div className="space-y-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-sand-100 dark:bg-ink-600 h-10 rounded"
            style={{ width: `${90 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Not-found state
// ============================================================

function NotFoundState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="font-display text-ink text-2xl font-bold dark:text-white">
        Recette introuvable
      </h2>
      <p className="text-ink-500 dark:text-ink-300 mt-2 max-w-sm text-sm/6">
        Cette recette a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/recipes"
        className="rounded-control bg-forest shadow-soft hover:bg-forest-700 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400 mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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

const RecipeEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading, isFetched, isError } = useRecipe(id ?? '')
  const updateRecipe = useUpdateRecipe()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors: formErrors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      servings: 4,
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      image_url: '',
      ingredient_groups: [
        { name: '', ingredients: [{ name: '', quantity: 0, unit: '' }] },
      ],
      steps: [],
    },
  })

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'ingredient_groups',
  })

  // Pre-populate the form when recipe data arrives.
  useEffect(() => {
    if (recipe) {
      reset(recipeToFormValues(recipe))
    }
  }, [recipe, reset])

  const onSubmit = (values: RecipeFormValues) => {
    const result = recipeFormSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors = toFormErrors(result.error.issues)
      for (const [path, error] of Object.entries(fieldErrors)) {
        setError(path as keyof RecipeFormValues, error)
      }
      return
    }

    if (!id) return

    const input = toUpdateRecipeInput(id, result.data)
    updateRecipe.mutate(input, {
      onSuccess: () => {
        void navigate(`/recipes/${id}`)
      },
    })
  }

  if (!id) return <NotFoundState />
  if (isLoading) return <LoadingState />
  if (isError || (isFetched && !recipe)) return <NotFoundState />

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to={id ? `/recipes/${id}` : '/recipes'}
        className="text-ink-500 hover:text-ink dark:text-ink-300 mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors dark:hover:text-white"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Retour à la recette
      </Link>

      <h1 className="font-display text-ink mb-6 text-2xl font-bold sm:text-3xl dark:text-white">
        Modifier la recette
      </h1>

      {/* Error banner */}
      {updateRecipe.isError && (
        <div
          role="alert"
          className="rounded-card border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400 mb-6 border p-4 text-sm"
        >
          Une erreur est survenue lors de l&apos;enregistrement de votre
          recette. Veuillez réessayer.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-8">
          {/* ── Basic info ── */}
          <section aria-labelledby="basic-heading">
            <h2
              id="basic-heading"
              className="font-display text-ink mb-4 text-lg font-semibold dark:text-white"
            >
              Informations de base
            </h2>

            <Card className="space-y-4 p-5">
              <TextField
                id="recipe-title"
                label="Titre"
                required
                placeholder="p. ex. Pizza Margherita classique"
                error={formErrors.title?.message}
                {...register('title')}
              />

              <TextareaField
                id="recipe-description"
                label="Description"
                placeholder="Une courte description de cette recette…"
                error={formErrors.description?.message}
                rows={3}
                {...register('description')}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextField
                  id="recipe-servings"
                  label="Portions"
                  type="number"
                  required
                  min={1}
                  error={formErrors.servings?.message}
                  {...register('servings', { valueAsNumber: true })}
                />
                <TextField
                  id="recipe-prep-time"
                  label="Temps de préparation (min)"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={formErrors.prep_time_minutes?.message}
                  {...register('prep_time_minutes', { valueAsNumber: true })}
                />
                <TextField
                  id="recipe-cook-time"
                  label="Temps de cuisson (min)"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={formErrors.cook_time_minutes?.message}
                  {...register('cook_time_minutes', { valueAsNumber: true })}
                />
              </div>

              <RecipeImageUpload
                value={watch('image_url') ?? ''}
                onChange={(url) => {
                  // If replacing an existing image, best-effort delete the old
                  // one from storage (ignore failures — the new URL is what matters).
                  const previousUrl = watch('image_url')
                  if (previousUrl && previousUrl !== url) {
                    const oldPath = extractStoragePath(previousUrl)
                    if (oldPath) {
                      void deleteRecipeImage(oldPath).catch(() => {
                        // Best-effort: log and continue.
                        console.error(
                          '[FamilyFood] Failed to delete old image',
                          oldPath,
                        )
                      })
                    }
                  }
                  setValue('image_url', url)
                }}
                recipeId={id}
                error={formErrors.image_url?.message}
              />
            </Card>
          </section>

          {/* ── Ingredient groups ── */}
          <section aria-labelledby="ingredients-heading">
            <h2
              id="ingredients-heading"
              className="font-display text-ink mb-4 text-lg font-semibold dark:text-white"
            >
              Ingrédients
            </h2>

            {formErrors.ingredient_groups?.message && (
              <p
                role="alert"
                className="text-error dark:text-error-400 mb-4 text-sm"
              >
                {formErrors.ingredient_groups.message}
              </p>
            )}

            <div className="space-y-6">
              {groupFields.map((groupField, groupIdx) => (
                <IngredientGroupCard
                  key={groupField.id}
                  groupIdx={groupIdx}
                  control={control}
                  register={register}
                  formErrors={formErrors}
                  onRemoveGroup={() => removeGroup(groupIdx)}
                  isOnlyGroup={groupFields.length === 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                appendGroup({
                  name: '',
                  ingredients: [{ name: '', quantity: 0, unit: '' }],
                })
              }
              className="rounded-card border-sand-200 text-ink-600 hover:border-sage hover:text-sage focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:border-sage-400 dark:hover:text-sage-300 dark:focus-visible:outline-forest-400 mt-4 inline-flex items-center gap-2 border border-dashed px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20"
            >
              <PlusIcon aria-hidden="true" className="size-4" />
              Ajouter un groupe d’ingrédients
            </button>
          </section>

          {/* ── Steps ── */}
          <StepsSection
            control={control}
            register={register}
            formErrors={formErrors}
          />

          {/* ── Submit ── */}
          <div className="border-sand-200 flex items-center justify-end gap-3 border-t pt-6 dark:border-white/10">
            <Link
              to={id ? `/recipes/${id}` : '/recipes'}
              className="rounded-control border-sand-200 bg-cream text-ink-700 shadow-soft hover:bg-sand-100 focus-visible:outline-forest-600 dark:text-ink-200 dark:focus-visible:outline-forest-400 inline-flex items-center justify-center border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Annuler
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateRecipe.isPending}
            >
              {updateRecipe.isPending
                ? 'Enregistrement…'
                : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default RecipeEditPage
