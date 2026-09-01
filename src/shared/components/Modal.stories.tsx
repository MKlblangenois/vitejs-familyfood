import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, within } from 'storybook/test'
import Modal from './Modal'
import Button from './Button'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

const ModalHarness = ({
  size,
  title,
  children,
  footer,
}: {
  size?: 'sm' | 'md' | 'lg'
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) => {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Ouvrir la modale</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size={size}
        footer={footer}
      >
        {children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: () => (
    <ModalHarness
      title="Nouvelle recette"
      footer={
        <>
          <Button variant="secondary" size="sm">
            Annuler
          </Button>
          <Button variant="primary" size="sm">
            Créer
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600 dark:text-ink-300">
        Remplissez les informations de votre nouvelle recette pour la partager
        avec votre famille.
      </p>
    </ModalHarness>
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      within(dialog).getByRole('heading', { name: 'Nouvelle recette' })
    ).toBeInTheDocument()
  },
}

export const Small: Story = {
  render: () => (
    <ModalHarness
      size="sm"
      title="Confirmer la suppression"
      footer={
        <>
          <Button variant="secondary" size="sm">
            Annuler
          </Button>
          <Button variant="destructive" size="sm">
            Supprimer
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600 dark:text-ink-300">
        Cette action est irréversible. Voulez-vous vraiment supprimer cette
        recette ?
      </p>
    </ModalHarness>
  ),
}

export const Large: Story = {
  render: () => (
    <ModalHarness
      size="lg"
      title="Détails de la recette"
      footer={
        <Button variant="primary" size="sm">
          Modifier
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-ink-600 dark:text-ink-300">
        <p>
          Une grande modale pour afficher du contenu plus riche, comme les
          détails complets d&apos;une recette avec ses ingrédients et ses
          étapes de préparation.
        </p>
        <p>
          Le contenu peut être aussi long que nécessaire — la modale gère le
          défilement vertical automatiquement.
        </p>
      </div>
    </ModalHarness>
  ),
}
