import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { TextInput } from '../../../shared/components/TextInput'
import { useCreateRecipe } from '../hooks'
import type { CreateRecipeInput } from '../types'

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
// Zod schema — used for manual validation in onSubmit.
// Input types align with what HTML <input type="number"> produces.
// ============================================================

const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  servings: z.number().min(1, 'Must be at least 1'),
  prep_time_minutes: z.number().min(0, 'Must be at least 0').optional(),
  cook_time_minutes: z.number().min(0, 'Must be at least 0').optional(),
  image_url: z.string().optional(),
  ingredient_groups: z
    .array(
      z.object({
        name: z.string().min(1, 'Group name is required'),
        ingredients: z
          .array(
            z.object({
              name: z.string().min(1, 'Ingredient name is required'),
              quantity: z.number().min(0, 'Must be at least 0'),
              unit: z.string().optional(),
            }),
          )
          .min(1, 'Add at least one ingredient'),
      }),
    )
    .min(1, 'Add at least one ingredient group'),
  steps: z.array(
    z.object({
      instruction: z.string().min(1, 'Step instruction is required'),
    }),
  ),
})

type RecipeFormValues = z.infer<typeof recipeFormSchema>

// ============================================================
// Helpers
// ============================================================

function toCreateRecipeInput(values: RecipeFormValues): CreateRecipeInput {
  return {
    title: values.title,
    description: values.description || null,
    image_url: values.image_url || null,
    servings: values.servings,
    prep_time_minutes: values.prep_time_minutes ?? null,
    cook_time_minutes: values.cook_time_minutes ?? null,
    ingredient_groups: values.ingredient_groups.map((group, gIdx) => ({
      name: group.name,
      position: gIdx,
      ingredients: group.ingredients.map((ing, iIdx) => ({
        name: ing.name,
        quantity: ing.quantity,
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
// Local styled components (consistent with TextInput patterns)
// ============================================================

function SelectInput({
  label,
  id,
  error,
  required = false,
  className,
  children,
  ...props
}: {
  label?: string
  id: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const errorId = `${id}-error`

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
        className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:focus:outline-indigo-500 sm:text-sm/6 ${label ? 'mt-1' : ''} ${className ?? ''}`}
      >
        {children}
      </select>
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function TextareaInput({
  label,
  id,
  error,
  required = false,
  className,
  ...props
}: {
  label: string
  id: string
  error?: string
  required?: boolean
  className?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        rows={3}
        {...props}
        className={`mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:focus:outline-indigo-500 sm:text-sm/6 ${className ?? ''}`}
      />
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
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
  formErrors: ReturnType<typeof useForm<RecipeFormValues>>['formState']['errors']
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
    <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
      {/* Group header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1">
          <TextInput
            id={`group-name-${groupIdx}`}
            label="Group name"
            placeholder="e.g. Dough, Toppings, Sauce"
            error={groupError?.name?.message}
            required
            {...register(`ingredient_groups.${groupIdx}.name`)}
          />
        </div>
        {!isOnlyGroup && (
          <button
            type="button"
            onClick={onRemoveGroup}
            className="mt-6 inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
            aria-label={`Remove ingredient group ${groupIdx + 1}`}
          >
            <TrashIcon aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      {groupError?.ingredients?.message && (
        <p
          role="alert"
          className="mb-3 text-sm text-red-600 dark:text-red-400"
        >
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
                  label={ingIdx === 0 ? 'Name' : undefined}
                  placeholder="Ingredient name"
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
                  label={ingIdx === 0 ? 'Qty' : undefined}
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
                <SelectInput
                  id={`ing-unit-${groupIdx}-${ingIdx}`}
                  label={ingIdx === 0 ? 'Unit' : undefined}
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
                </SelectInput>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(ingIdx)}
                aria-label={`Remove ingredient ${ingIdx + 1}`}
                className="mb-0.5 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
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
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-visible:outline-indigo-500"
      >
        <PlusIcon aria-hidden="true" className="size-3.5" />
        Add ingredient
      </button>
    </div>
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
  formErrors: ReturnType<typeof useForm<RecipeFormValues>>['formState']['errors']
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
        className="mb-4 font-display text-lg font-semibold text-gray-900 dark:text-white"
      >
        Steps
      </h2>

      <div className="space-y-3">
        {stepFields.map((stepField, stepIdx) => {
          const stepError = formErrors.steps?.[stepIdx]
          return (
            <div key={stepField.id} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white dark:bg-indigo-500">
                {stepIdx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor={`step-${stepIdx}`} className="sr-only">
                  Step {stepIdx + 1}
                </label>
                <textarea
                  id={`step-${stepIdx}`}
                  rows={2}
                  placeholder={`Describe step ${stepIdx + 1}…`}
                  aria-describedby={
                    stepError?.instruction?.message
                      ? `step-${stepIdx}-error`
                      : undefined
                  }
                  aria-invalid={
                    stepError?.instruction?.message ? 'true' : undefined
                  }
                  {...register(`steps.${stepIdx}.instruction`)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:focus:outline-indigo-500"
                />
                {stepError?.instruction?.message && (
                  <p
                    id={`step-${stepIdx}-error`}
                    role="alert"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {stepError.instruction.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeStep(stepIdx)}
                aria-label={`Remove step ${stepIdx + 1}`}
                className="mt-1 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:focus-visible:outline-red-500"
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
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/20 dark:text-gray-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400 dark:focus-visible:outline-indigo-500"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
        Add step
      </button>
    </section>
  )
}

// ============================================================
// Main component
// ============================================================

const RecipeCreatePage = () => {
  const navigate = useNavigate()
  const createRecipe = useCreateRecipe()

  const {
    register,
    control,
    handleSubmit,
    setError,
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

  const onSubmit = (values: RecipeFormValues) => {
    const result = recipeFormSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors = toFormErrors(result.error.issues)
      for (const [path, error] of Object.entries(fieldErrors)) {
        setError(path as keyof RecipeFormValues, error)
      }
      return
    }

    const input = toCreateRecipeInput(result.data)
    createRecipe.mutate(input, {
      onSuccess: (recipe) => {
        void navigate(`/recipes/${recipe.id}`)
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/recipes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        All recipes
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        New Recipe
      </h1>

      {/* Error banner */}
      {createRecipe.isError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          Something went wrong while creating your recipe. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-8">
          {/* ── Basic info ── */}
          <section aria-labelledby="basic-heading">
            <h2
              id="basic-heading"
              className="mb-4 font-display text-lg font-semibold text-gray-900 dark:text-white"
            >
              Basic Info
            </h2>

            <div className="space-y-4">
              <TextInput
                id="recipe-title"
                label="Title"
                required
                placeholder="e.g. Classic Margherita Pizza"
                error={formErrors.title?.message}
                {...register('title')}
              />

              <TextareaInput
                id="recipe-description"
                label="Description"
                placeholder="A short description of this recipe…"
                error={formErrors.description?.message}
                {...register('description')}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextInput
                  id="recipe-servings"
                  label="Servings"
                  type="number"
                  required
                  min={1}
                  error={formErrors.servings?.message}
                  {...register('servings', { valueAsNumber: true })}
                />
                <TextInput
                  id="recipe-prep-time"
                  label="Prep time (min)"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={formErrors.prep_time_minutes?.message}
                  {...register('prep_time_minutes', { valueAsNumber: true })}
                />
                <TextInput
                  id="recipe-cook-time"
                  label="Cook time (min)"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={formErrors.cook_time_minutes?.message}
                  {...register('cook_time_minutes', { valueAsNumber: true })}
                />
              </div>

              <TextInput
                id="recipe-image-url"
                label="Image URL"
                placeholder="https://example.com/photo.jpg"
                error={formErrors.image_url?.message}
                {...register('image_url')}
              />
            </div>
          </section>

          {/* ── Ingredient groups ── */}
          <section aria-labelledby="ingredients-heading">
            <h2
              id="ingredients-heading"
              className="mb-4 font-display text-lg font-semibold text-gray-900 dark:text-white"
            >
              Ingredients
            </h2>

            {formErrors.ingredient_groups?.message && (
              <p
                role="alert"
                className="mb-4 text-sm text-red-600 dark:text-red-400"
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
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/20 dark:text-gray-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              <PlusIcon aria-hidden="true" className="size-4" />
              Add ingredient group
            </button>
          </section>

          {/* ── Steps ── */}
          <StepsSection
            control={control}
            register={register}
            formErrors={formErrors}
          />

          {/* ── Submit ── */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-white/10">
            <Link
              to="/recipes"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus-visible:outline-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createRecipe.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400"
            >
              {createRecipe.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating…
                </>
              ) : (
                'Create recipe'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default RecipeCreatePage
