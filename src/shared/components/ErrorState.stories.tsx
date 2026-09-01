import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import ErrorState from './ErrorState'

const meta = {
  title: 'UI/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Une erreur est survenue',
    description:
      'Impossible de charger vos recettes. Vérifiez votre connexion et réessayez.',
  },
}

export const WithRetry: Story = {
  args: {
    title: 'Impossible de charger les données',
    description:
      'Le serveur ne répond pas. Vous pouvez réessayer dans quelques instants.',
    onRetry: () => {
      // Storybook interaction: clicking "Réessayer" triggers this callback.
    },
  },
  play: async ({ canvas }) => {
    const retryButton = canvas.getByRole('button', { name: 'Réessayer' })
    await userEvent.click(retryButton)
    await expect(retryButton).toBeEnabled()
  },
}

export const Minimal: Story = {
  args: {
    title: 'Erreur de synchronisation',
  },
}
