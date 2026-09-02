import type { Meta, StoryObj } from '@storybook/react-vite'
import { ItemRow } from './pages/ShoppingListDetailPage'
import { withQueryClient } from '../storybookHelpers'
import {
  mockShoppingListItem,
  mockShoppingListItemChecked,
  mockShoppingListItemNoQuantity,
} from '../mockData'

const meta = {
  title: 'ShoppingLists/ItemRow',
  component: ItemRow,
  tags: ['autodocs'],
  decorators: [withQueryClient],
} satisfies Meta<typeof ItemRow>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  render: () => (
    <ItemRow
      item={mockShoppingListItem}
      listId="list-1"
      onEdit={() => {}}
      onDelete={() => {}}
    />
  ),
}

export const Checked: Story = {
  render: () => (
    <ItemRow
      item={mockShoppingListItemChecked}
      listId="list-1"
      onEdit={() => {}}
      onDelete={() => {}}
    />
  ),
}

export const WithQuantityAndUnit: Story = {
  render: () => (
    <ItemRow
      item={mockShoppingListItem}
      listId="list-1"
      onEdit={() => {}}
      onDelete={() => {}}
    />
  ),
}

export const WithoutQuantity: Story = {
  render: () => (
    <ItemRow
      item={mockShoppingListItemNoQuantity}
      listId="list-1"
      onEdit={() => {}}
      onDelete={() => {}}
    />
  ),
}
