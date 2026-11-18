import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecipesPage from './pages/RecipesPage'
import AppShell from '../../shared/components/AppShell'
import { mockRecipe, mockRecipeNoImage, mockRecipeLongTitle } from '../mockData'
import { withRouter } from '../storybookHelpers'
import { recipeKeys } from './hooks/queryKeys'

const meta = {
  title: 'Recipes/RecipesPage',
  component: RecipesPage,
  decorators: [
    (Story) => {
      const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
      client.setQueryData(recipeKeys.lists(), [mockRecipe, mockRecipeNoImage, mockRecipeLongTitle])
      return <QueryClientProvider client={client}><AppShell><Story /></AppShell></QueryClientProvider>
    },
    withRouter,
  ],
} satisfies Meta<typeof RecipesPage>

export default meta
export const Collection: StoryObj<typeof meta> = {}
