import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { ServingsStepper } from './pages/RecipeDetailPage'

const meta = {
  title: 'Recipes/ServingsStepper',
  component: ServingsStepper,
  tags: ['autodocs'],
} satisfies Meta<typeof ServingsStepper>

export default meta
type Story = StoryObj<typeof meta>

const ServingsHarness = ({ initial }: { initial: number }) => {
  const [servings, setServings] = useState(initial)
  return (
    <ServingsStepper
      servings={servings}
      onDecrement={() => setServings((prev) => Math.max(1, prev - 1))}
      onIncrement={() => setServings((prev) => prev + 1)}
    />
  )
}

export const Default: Story = {
  render: () => <ServingsHarness initial={4} />,
}

export const AtMin: Story = {
  render: () => <ServingsHarness initial={1} />,
}

export const LargeValue: Story = {
  render: () => <ServingsHarness initial={12} />,
}

export const Increments: Story = {
  render: () => <ServingsHarness initial={4} />,
  play: async ({ canvas }) => {
    const value = canvas.getByText('4')
    const increment = canvas.getByRole('button', {
      name: 'Augmenter les portions',
    })
    await userEvent.click(increment)
    await expect(value).toHaveTextContent('5')
    await userEvent.click(increment)
    await expect(value).toHaveTextContent('6')
  },
}

export const Decrements: Story = {
  render: () => <ServingsHarness initial={4} />,
  play: async ({ canvas }) => {
    const value = canvas.getByText('4')
    const decrement = canvas.getByRole('button', {
      name: 'Diminuer les portions',
    })
    await userEvent.click(decrement)
    await expect(value).toHaveTextContent('3')
  },
}

export const StopsAtMin: Story = {
  render: () => <ServingsHarness initial={1} />,
  play: async ({ canvas }) => {
    const value = canvas.getByText('1')
    const decrement = canvas.getByRole('button', {
      name: 'Diminuer les portions',
    })
    await userEvent.click(decrement)
    await expect(value).toHaveTextContent('1')
  },
}