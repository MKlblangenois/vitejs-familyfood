import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import AddToShoppingListModal from './components/AddToShoppingListModal'
import { withQueryClient, resetSupabaseMock } from '../storybookHelpers'
import { __mockHelpers } from '../../shared/lib/__mocks__/supabase'
import {
  mockRecipeWithRelations,
  mockShoppingList,
  mockShoppingListWithRelations,
} from '../mockData'

const meta = {
  title: 'Recipes/AddToShoppingListModal',
  component: AddToShoppingListModal,
  tags: ['autodocs'],
  decorators: [withQueryClient],
  beforeEach: () => {
    resetSupabaseMock()
    __mockHelpers.setQueryResult('shopping_lists', {
      data: [mockShoppingList],
      error: null,
    })
  },
} satisfies Meta<typeof AddToShoppingListModal>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {
  render: () => (
    <AddToShoppingListModal
      open={false}
      onClose={() => {}}
      recipe={mockRecipeWithRelations}
    />
  ),
}

export const Open: Story = {
  render: () => (
    <AddToShoppingListModal
      open
      onClose={() => {}}
      recipe={mockRecipeWithRelations}
    />
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      within(dialog).getByRole('heading', {
        name: 'Ajouter à la liste de courses',
      })
    ).toBeInTheDocument()
    await expect(
      within(dialog).getByLabelText('Liste de courses')
    ).toBeInTheDocument()
  },
}

export const WithServings: Story = {
  render: () => (
    <AddToShoppingListModal
      open
      onClose={() => {}}
      recipe={mockRecipeWithRelations}
      initialServings={8}
    />
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole('dialog')
    const servingsInput = within(dialog).getByLabelText('Portions')
    await expect(servingsInput).toHaveValue('8')
  },
}

export const WithError: Story = {
  render: () => (
    <AddToShoppingListModal
      open
      onClose={() => {}}
      recipe={mockRecipeWithRelations}
    />
  ),
  play: async ({ canvas }) => {
    // Make the target list query resolve and the mutation reject.
    __mockHelpers.setSingleResult('shopping_lists', {
      data: mockShoppingListWithRelations,
      error: null,
    })
    __mockHelpers.setMutationError(
      'shopping_list_items',
      new Error('Échec de l’ajout des articles.'),
    )

    const dialog = await canvas.findByRole('dialog')
    const select = within(dialog).getByLabelText('Liste de courses')
    await userEvent.selectOptions(select, mockShoppingList.id)

    const submit = within(dialog).getByRole('button', {
      name: 'Ajouter à la liste',
    })
    await userEvent.click(submit)

    const alert = await within(dialog).findByRole('alert')
    await expect(alert).toHaveTextContent(
      'Échec de l’ajout des articles.',
    )
  },
}