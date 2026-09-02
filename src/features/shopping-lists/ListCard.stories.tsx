import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { ListCard } from './pages/ShoppingListsPage'
import { withRouter } from '../storybookHelpers'
import { mockShoppingList, mockShoppingListMember } from '../mockData'

const meta = {
  title: 'ShoppingLists/ListCard',
  component: ListCard,
  tags: ['autodocs'],
  decorators: [withRouter],
} satisfies Meta<typeof ListCard>

export default meta
type Story = StoryObj<typeof meta>

const ListCardHarness = () => {
  const [renamed, setRenamed] = useState(false)
  const [deleted, setDeleted] = useState(false)
  return (
    <div className="space-y-4">
      <ListCard
        list={mockShoppingList}
        currentUserId="user-1"
        onRename={() => setRenamed(true)}
        onDelete={() => setDeleted(true)}
      />
      <p className="text-ink-500 dark:text-ink-300 text-sm">
        Renommée : {renamed ? 'oui' : 'non'} · Supprimée :{' '}
        {deleted ? 'oui' : 'non'}
      </p>
    </div>
  )
}

export const OwnerView: Story = {
  render: () => (
    <ListCard
      list={mockShoppingList}
      currentUserId="user-1"
      onRename={() => {}}
      onDelete={() => {}}
    />
  ),
}

export const MemberView: Story = {
  render: () => (
    <ListCard
      list={mockShoppingListMember}
      currentUserId="user-1"
      onRename={() => {}}
      onDelete={() => {}}
    />
  ),
}

export const WithCallbacks: Story = {
  render: () => <ListCardHarness />,
  play: async ({ canvas }) => {
    const renameButton = canvas.getByRole('button', {
      name: `Renommer « ${mockShoppingList.title} »`,
    })
    await userEvent.click(renameButton)
    await expect(canvas.getByText(/Renommée : oui/)).toBeInTheDocument()

    const deleteButton = canvas.getByRole('button', {
      name: `Supprimer « ${mockShoppingList.title} »`,
    })
    await userEvent.click(deleteButton)
    await expect(canvas.getByText(/Supprimée : oui/)).toBeInTheDocument()
  },
}
