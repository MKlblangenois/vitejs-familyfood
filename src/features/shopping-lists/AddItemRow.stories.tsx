import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddItemRow } from './pages/ShoppingListDetailPage'
import { withQueryClient } from '../storybookHelpers'

const meta = {
  title: 'ShoppingLists/AddItemRow',
  component: AddItemRow,
  tags: ['autodocs'],
  decorators: [withQueryClient],
} satisfies Meta<typeof AddItemRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <AddItemRow listId="list-1" />,
}