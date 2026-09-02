import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeaturedRecipeCard, CompactRecipeCard } from './pages/RecipesPage'
import { withRouter } from '../storybookHelpers'
import {
  mockRecipe,
  mockRecipeNoImage,
  mockRecipeLongTitle,
  mockRecipeMinimal,
} from '../mockData'

const meta = {
  title: 'Recipes/RecipeCard',
  component: FeaturedRecipeCard,
  tags: ['autodocs'],
  decorators: [withRouter],
} satisfies Meta<typeof FeaturedRecipeCard>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------
// FeaturedRecipeCard
// ---------------------------------------------------------------------------

export const FeaturedWithImage: Story = {
  render: () => <FeaturedRecipeCard recipe={mockRecipe} />,
}

export const FeaturedWithoutImage: Story = {
  render: () => <FeaturedRecipeCard recipe={mockRecipeNoImage} />,
}

export const FeaturedWithDescription: Story = {
  render: () => <FeaturedRecipeCard recipe={mockRecipe} />,
}

export const FeaturedLongTitle: Story = {
  render: () => <FeaturedRecipeCard recipe={mockRecipeLongTitle} />,
}

export const FeaturedMinimal: Story = {
  render: () => <FeaturedRecipeCard recipe={mockRecipeMinimal} />,
}

// ---------------------------------------------------------------------------
// CompactRecipeCard
// ---------------------------------------------------------------------------

export const CompactWithImage: Story = {
  render: () => <CompactRecipeCard recipe={mockRecipe} />,
}

export const CompactWithoutImage: Story = {
  render: () => <CompactRecipeCard recipe={mockRecipeNoImage} />,
}

export const CompactWithDescription: Story = {
  render: () => <CompactRecipeCard recipe={mockRecipe} />,
}

export const CompactLongTitle: Story = {
  render: () => <CompactRecipeCard recipe={mockRecipeLongTitle} />,
}

export const CompactMinimal: Story = {
  render: () => <CompactRecipeCard recipe={mockRecipeMinimal} />,
}
