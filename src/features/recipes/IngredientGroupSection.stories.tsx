import type { Meta, StoryObj } from '@storybook/react-vite'
import { IngredientGroupSection } from './pages/RecipeDetailPage'
import { mockRecipeWithRelations, mockRecipeSingleGroup } from '../mockData'

const meta = {
  title: 'Recipes/IngredientGroup',
  component: IngredientGroupSection,
  tags: ['autodocs'],
} satisfies Meta<typeof IngredientGroupSection>

export default meta
type Story = StoryObj<typeof meta>

export const SingleGroup: Story = {
  render: () => (
    <IngredientGroupSection
      group={mockRecipeSingleGroup.recipe_ingredient_groups[0]}
      originalServings={4}
      targetServings={4}
    />
  ),
}

export const GroupWithName: Story = {
  render: () => (
    <IngredientGroupSection
      group={mockRecipeWithRelations.recipe_ingredient_groups[0]}
      originalServings={4}
      targetServings={4}
    />
  ),
}

export const MultipleIngredients: Story = {
  render: () => (
    <IngredientGroupSection
      group={mockRecipeWithRelations.recipe_ingredient_groups[1]}
      originalServings={4}
      targetServings={4}
    />
  ),
}

export const ScaledServings: Story = {
  render: () => (
    <IngredientGroupSection
      group={mockRecipeWithRelations.recipe_ingredient_groups[1]}
      originalServings={4}
      targetServings={8}
    />
  ),
}

export const ScaledDownServings: Story = {
  render: () => (
    <IngredientGroupSection
      group={mockRecipeWithRelations.recipe_ingredient_groups[1]}
      originalServings={4}
      targetServings={2}
    />
  ),
}