import type { Meta, StoryObj } from '@storybook/react-vite'
import SelectField from './SelectField'

const meta = {
  title: 'UI/SelectField',
  component: SelectField,
  tags: ['autodocs'],
} satisfies Meta<typeof SelectField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'default',
    label: 'Catégorie',
    children: (
      <>
        <option value="">Sélectionnez une catégorie…</option>
        <option value="entree">Entrée</option>
        <option value="plat">Plat principal</option>
        <option value="dessert">Dessert</option>
      </>
    ),
  },
}

export const WithOptions: Story = {
  args: {
    id: 'with-options',
    label: 'Difficulté',
    defaultValue: 'moyen',
    children: (
      <>
        <option value="facile">Facile</option>
        <option value="moyen">Moyen</option>
        <option value="difficile">Difficile</option>
      </>
    ),
  },
}

export const WithError: Story = {
  args: {
    id: 'with-error',
    label: 'Catégorie',
    error: 'Veuillez sélectionner une catégorie.',
    children: (
      <>
        <option value="">Sélectionnez une catégorie…</option>
        <option value="entree">Entrée</option>
        <option value="plat">Plat principal</option>
      </>
    ),
  },
}

export const WithHint: Story = {
  args: {
    id: 'with-hint',
    label: 'Portions',
    hint: 'Choisissez le nombre de personnes.',
    children: (
      <>
        <option value="1">1 personne</option>
        <option value="2">2 personnes</option>
        <option value="4">4 personnes</option>
        <option value="6">6 personnes</option>
      </>
    ),
  },
}
