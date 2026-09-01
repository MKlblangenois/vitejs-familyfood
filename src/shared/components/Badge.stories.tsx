import type { Meta, StoryObj } from '@storybook/react-vite'
import Badge from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['sage', 'citrus', 'tomato', 'forest', 'neutral'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Sage: Story = {
  args: {
    children: 'Végétarien',
    variant: 'sage',
  },
}

export const Citrus: Story = {
  args: {
    children: 'Rapide',
    variant: 'citrus',
  },
}

export const Tomato: Story = {
  args: {
    children: 'Épicé',
    variant: 'tomato',
  },
}

export const Forest: Story = {
  args: {
    children: 'Bio',
    variant: 'forest',
  },
}

export const Neutral: Story = {
  args: {
    children: 'Défaut',
    variant: 'neutral',
  },
}
