import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppShell from '../../shared/components/AppShell'
import { mockRecipeWithRelations } from '../mockData'
import { recipeKeys } from './hooks/queryKeys'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeCreatePage from './pages/RecipeCreatePage'
import RecipeEditPage from './pages/RecipeEditPage'

function Preview({ path }: { path: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })
  client.setQueryData(
    recipeKeys.detail(mockRecipeWithRelations.id),
    mockRecipeWithRelations,
  )
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppShell>
          <Routes>
            <Route path="/recipes/new" element={<RecipeCreatePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
          </Routes>
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const meta = {
  title: 'Recipes/RecipeViews',
  component: Preview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Preview>
export default meta
type Story = StoryObj<typeof meta>
export const Detail: Story = {
  args: { path: `/recipes/${mockRecipeWithRelations.id}` },
}
export const Creation: Story = { args: { path: '/recipes/new' } }
export const Modification: Story = {
  args: { path: `/recipes/${mockRecipeWithRelations.id}/edit` },
}
