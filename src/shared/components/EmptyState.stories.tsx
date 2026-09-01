import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import EmptyState from './EmptyState'
import Button from './Button'

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const WithIcon: Story = {
  args: {
    icon: <BookOpenIcon className="size-7" />,
    title: 'Aucune recette',
    description:
      'Commencez à créer vos recettes préférées pour les retrouver ici.',
  },
}

export const WithAction: Story = {
  args: {
    icon: <BookOpenIcon className="size-7" />,
    title: 'Aucune recette',
    description:
      'Commencez à créer vos recettes préférées pour les retrouver ici.',
    action: (
      <Button variant="primary" size="md">
        Créer une recette
      </Button>
    ),
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Rien à afficher',
  },
}

export const Full: Story = {
  args: {
    icon: <BookOpenIcon className="size-7" />,
    title: 'Votre bibliothèque est vide',
    description:
      'Ajoutez vos recettes de famille, vos plats favoris et vos idées de repas pour les retrouver en un clin d’œil.',
    action: (
      <Button variant="citrus" size="md">
        Ajouter une recette
      </Button>
    ),
  },
}
