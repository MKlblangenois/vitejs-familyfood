import type { Meta, StoryObj } from '@storybook/react-vite'
import TextField from './TextField'

const meta = {
  title: 'UI/TextField',
  component: TextField,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'default',
    label: 'Nom de la recette',
    placeholder: 'Ex. : Risotto aux champignons',
  },
}

export const WithValue: Story = {
  args: {
    id: 'with-value',
    label: 'Nom de la recette',
    defaultValue: 'Risotto aux champignons',
  },
}

export const WithHint: Story = {
  args: {
    id: 'with-hint',
    label: 'Temps de préparation',
    hint: 'Indiquez le temps en minutes.',
    placeholder: 'Ex. : 30',
  },
}

export const WithError: Story = {
  args: {
    id: 'with-error',
    label: 'Email',
    defaultValue: 'invalide',
    error: 'Veuillez saisir une adresse email valide.',
    type: 'email',
  },
}

export const Disabled: Story = {
  args: {
    id: 'disabled',
    label: 'Champ désactivé',
    defaultValue: 'Valeur non modifiable',
    disabled: true,
  },
}

export const Password: Story = {
  args: {
    id: 'password',
    label: 'Mot de passe',
    type: 'password',
    placeholder: '••••••••',
  },
}
