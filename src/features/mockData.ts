// ============================================================
// Shared mock data for feature-level Storybook stories.
// Realistic French recipes and shopping lists.
// ============================================================

import type { Recipe, RecipeWithRelations } from './recipes/types'
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListWithRelations,
} from './shopping-lists/types'

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export const mockRecipe: Recipe = {
  id: 'recipe-1',
  user_id: 'user-1',
  title: 'Poulet rôti aux herbes',
  description:
    'Un poulet entier rôti lentement avec du thym, du romarin et de l’ail. Parfait pour un dîner en famille.',
  image_url:
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  servings: 4,
  prep_time_minutes: 20,
  cook_time_minutes: 75,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

export const mockRecipeNoImage: Recipe = {
  ...mockRecipe,
  id: 'recipe-2',
  title: 'Soupe de légumes d’hiver',
  description: 'Une soupe réconfortante aux légumes de saison.',
  image_url: null,
  servings: 6,
  prep_time_minutes: 15,
  cook_time_minutes: 40,
}

export const mockRecipeLongTitle: Recipe = {
  ...mockRecipe,
  id: 'recipe-3',
  title:
    'Gratin de pommes de terre, courgettes et tomates confites au thym frais du jardin',
  description:
    'Un gratin généreux et savoureux, parfait pour accompagner un plat de viande ou se suffire à lui-même avec une salade verte.',
  image_url:
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
  servings: 8,
  prep_time_minutes: 30,
  cook_time_minutes: 60,
}

export const mockRecipeMinimal: Recipe = {
  id: 'recipe-4',
  user_id: 'user-1',
  title: 'Omelette',
  description: null,
  image_url: null,
  servings: 1,
  prep_time_minutes: null,
  cook_time_minutes: null,
  created_at: '2026-02-01T08:00:00Z',
  updated_at: '2026-02-01T08:00:00Z',
}

// ---------------------------------------------------------------------------
// Recipe with relations (for detail-page sub-components)
// ---------------------------------------------------------------------------

export const mockRecipeWithRelations: RecipeWithRelations = {
  ...mockRecipe,
  recipe_ingredient_groups: [
    {
      id: 'group-1',
      recipe_id: 'recipe-1',
      name: 'Pour la marinade',
      position: 1,
      recipe_ingredients: [
        {
          id: 'ing-1',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Huile d’olive',
          quantity: 4,
          unit: 'c. à soupe',
          position: 1,
        },
        {
          id: 'ing-2',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Jus de citron',
          quantity: 1,
          unit: 'citron',
          position: 2,
        },
        {
          id: 'ing-3',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Ail',
          quantity: 3,
          unit: 'gousses',
          position: 3,
        },
      ],
    },
    {
      id: 'group-2',
      recipe_id: 'recipe-1',
      name: 'Pour la cuisson',
      position: 2,
      recipe_ingredients: [
        {
          id: 'ing-4',
          group_id: 'group-2',
          recipe_id: 'recipe-1',
          name: 'Poulet entier',
          quantity: 1,
          unit: 'pièce',
          position: 1,
        },
        {
          id: 'ing-5',
          group_id: 'group-2',
          recipe_id: 'recipe-1',
          name: 'Thym frais',
          quantity: 4,
          unit: 'branches',
          position: 2,
        },
        {
          id: 'ing-6',
          group_id: 'group-2',
          recipe_id: 'recipe-1',
          name: 'Romarin',
          quantity: 2,
          unit: 'branches',
          position: 3,
        },
        {
          id: 'ing-7',
          group_id: 'group-2',
          recipe_id: 'recipe-1',
          name: 'Pommes de terre',
          quantity: 800,
          unit: 'g',
          position: 4,
        },
      ],
    },
  ],
  recipe_steps: [
    {
      id: 'step-1',
      recipe_id: 'recipe-1',
      instruction:
        'Préchauffez le four à 180 °C. Mélangez l’huile d’olive, le jus de citron et l’ail écrasé dans un bol.',
      position: 1,
    },
    {
      id: 'step-2',
      recipe_id: 'recipe-1',
      instruction:
        'Badigeonnez le poulet avec la marinade, puis glissez le thym et le romarin sous la peau.',
      position: 2,
    },
    {
      id: 'step-3',
      recipe_id: 'recipe-1',
      instruction:
        'Disposez les pommes de terre coupées en quartiers autour du poulet dans un plat allant au four.',
      position: 3,
    },
    {
      id: 'step-4',
      recipe_id: 'recipe-1',
      instruction:
        'Enfournez pendant 1 h 15, en arrosant le poulet de son jus toutes les 20 minutes.',
      position: 4,
    },
    {
      id: 'step-5',
      recipe_id: 'recipe-1',
      instruction:
        'Laissez reposer 10 minutes avant de découper et de servir avec les pommes de terre rôties.',
      position: 5,
    },
  ],
}

export const mockRecipeSingleGroup: RecipeWithRelations = {
  ...mockRecipe,
  recipe_ingredient_groups: [
    {
      id: 'group-1',
      recipe_id: 'recipe-1',
      name: '',
      position: 1,
      recipe_ingredients: [
        {
          id: 'ing-1',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Œufs',
          quantity: 3,
          unit: 'pièces',
          position: 1,
        },
        {
          id: 'ing-2',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Beurre',
          quantity: 20,
          unit: 'g',
          position: 2,
        },
        {
          id: 'ing-3',
          group_id: 'group-1',
          recipe_id: 'recipe-1',
          name: 'Sel',
          quantity: null,
          unit: null,
          position: 3,
        },
      ],
    },
  ],
  recipe_steps: [],
}

// ---------------------------------------------------------------------------
// Shopping lists
// ---------------------------------------------------------------------------

export const mockShoppingList: ShoppingList = {
  id: 'list-1',
  owner_id: 'user-1',
  title: 'Courses de la semaine',
  created_at: '2026-01-10T09:00:00Z',
  updated_at: '2026-01-12T18:30:00Z',
}

export const mockShoppingListMember: ShoppingList = {
  id: 'list-2',
  owner_id: 'user-other',
  title: 'Liste partagée — barbecue',
  created_at: '2026-01-20T14:00:00Z',
  updated_at: '2026-01-21T11:00:00Z',
}

export const mockShoppingListItem: ShoppingListItem = {
  id: 'item-1',
  list_id: 'list-1',
  name: 'Lait demi-écrémé',
  quantity: 2,
  unit: 'L',
  checked: false,
  created_by: 'user-1',
  created_at: '2026-01-10T09:00:00Z',
  updated_at: '2026-01-10T09:00:00Z',
}

export const mockShoppingListItemChecked: ShoppingListItem = {
  ...mockShoppingListItem,
  id: 'item-2',
  name: 'Pain complet',
  quantity: 1,
  unit: 'baguette',
  checked: true,
}

export const mockShoppingListItemNoQuantity: ShoppingListItem = {
  ...mockShoppingListItem,
  id: 'item-3',
  name: 'Beurre de cacahuète',
  quantity: null,
  unit: null,
  checked: false,
}

export const mockShoppingListWithRelations: ShoppingListWithRelations = {
  ...mockShoppingList,
  shopping_list_members: [
    {
      id: 'member-1',
      list_id: 'list-1',
      user_id: 'user-1',
      role: 'owner',
      created_at: '2026-01-10T09:00:00Z',
    },
  ],
  shopping_list_items: [
    mockShoppingListItem,
    mockShoppingListItemChecked,
    mockShoppingListItemNoQuantity,
  ],
}