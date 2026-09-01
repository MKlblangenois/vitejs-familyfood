import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import CategoryChip from './CategoryChip'

const meta = {
  title: 'UI/CategoryChip',
  component: CategoryChip,
  tags: ['autodocs'],
} satisfies Meta<typeof CategoryChip>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: {
    label: 'Plats',
    active: true,
    onClick: () => {
      // Storybook interaction: clicking toggles the chip.
    },
  },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Plats' })
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Inactive: Story = {
  args: {
    label: 'Desserts',
    active: false,
    onClick: () => {
      // Storybook interaction: clicking toggles the chip.
    },
  },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Desserts' })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)
    await expect(chip).toBeEnabled()
  },
}

export const Row: Story = {
  render: () => (
    <div className="flex gap-2">
      <CategoryChip label="Tous" active onClick={() => {}} />
      <CategoryChip label="Entrées" onClick={() => {}} />
      <CategoryChip label="Plats" onClick={() => {}} />
      <CategoryChip label="Desserts" onClick={() => {}} />
    </div>
  ),
}
