import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Button from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'citrus', 'destructive', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Créer une recette',
    variant: 'primary',
    size: 'md',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Annuler',
    variant: 'secondary',
    size: 'md',
  },
}

export const Citrus: Story = {
  args: {
    children: 'Ajouter au panier',
    variant: 'citrus',
    size: 'md',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Supprimer',
    variant: 'destructive',
    size: 'md',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Voir plus',
    variant: 'ghost',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    children: 'Petit bouton',
    variant: 'primary',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    children: 'Bouton moyen',
    variant: 'primary',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    children: 'Grand bouton',
    variant: 'primary',
    size: 'lg',
  },
}

export const Loading: Story = {
  args: {
    children: 'Enregistrement…',
    variant: 'primary',
    size: 'md',
    isLoading: true,
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Nouvelle recette',
    variant: 'primary',
    size: 'md',
    icon: <PlusIcon className="size-4" />,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Bouton désactivé',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Bouton désactivé' })
    await expect(button).toBeDisabled()
  },
}

export const LoadingWithIcon: Story = {
  args: {
    children: 'Synchronisation…',
    variant: 'secondary',
    size: 'md',
    isLoading: true,
    icon: <ArrowPathIcon className="size-4" />,
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Synchronisation…' })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-disabled', 'true')
  },
}

export const Clickable: Story = {
  args: {
    children: 'Cliquez-moi',
    variant: 'citrus',
    size: 'md',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Cliquez-moi' })
    await userEvent.click(button)
    await expect(button).toBeEnabled()
  },
}
