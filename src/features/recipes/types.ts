// ============================================================
// Recipe feature types — mirrors the Supabase schema exactly.
// ============================================================

/** Row type for the `recipes` table. */
export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  created_at: string
  updated_at: string
}

/** Row type for the `recipe_ingredient_groups` table. */
export interface RecipeIngredientGroup {
  id: string
  recipe_id: string
  name: string
  position: number
}

/** Row type for the `recipe_ingredients` table. */
export interface RecipeIngredient {
  id: string
  group_id: string | null
  recipe_id: string
  name: string
  quantity: number | null
  unit: string | null
  position: number
}

/** Row type for the `recipe_steps` table. */
export interface RecipeStep {
  id: string
  recipe_id: string
  instruction: string
  position: number
}

/**
 * A recipe with its nested relations (groups → ingredients, steps).
 * Keys match the PostgREST response, which uses actual table names:
 * `recipe_ingredient_groups`, `recipe_ingredients`, and `recipe_steps`.
 */
export interface RecipeWithRelations extends Recipe {
  recipe_ingredient_groups: (RecipeIngredientGroup & {
    recipe_ingredients: RecipeIngredient[]
  })[]
  recipe_steps: RecipeStep[]
}

// ============================================================
// Input types for create / update operations
// ============================================================

/** Payload to create a new ingredient. */
export interface IngredientInput {
  name: string
  quantity: number | null
  unit: string | null
  position: number
}

/** Payload to create a new ingredient group (with its ingredients). */
export interface IngredientGroupInput {
  name: string
  position: number
  ingredients: IngredientInput[]
}

/** Payload to create a new step. */
export interface StepInput {
  instruction: string
  position: number
}

/** Payload to create a recipe (without id, timestamps, user_id — those are set server-side). */
export interface CreateRecipeInput {
  title: string
  description?: string | null
  image_url?: string | null
  servings?: number
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  ingredient_groups: IngredientGroupInput[]
  steps: StepInput[]
}

/** Payload to update a recipe. All fields optional except those required to identify relations. */
export interface UpdateRecipeInput {
  id: string
  title?: string
  description?: string | null
  image_url?: string | null
  servings?: number
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  /**
   * Ingredient groups to replace on the recipe.
   * - `undefined` → leave existing groups unchanged.
   * - `[]` → delete all existing groups (clear).
   * - Non-empty array → delete existing groups and insert the provided ones.
   */
  ingredient_groups?: IngredientGroupInput[]
  /**
   * Steps to replace on the recipe.
   * - `undefined` → leave existing steps unchanged.
   * - `[]` → delete all existing steps (clear).
   * - Non-empty array → delete existing steps and insert the provided ones.
   */
  steps?: StepInput[]
}
