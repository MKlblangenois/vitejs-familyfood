import type { Meta, StoryObj } from '@storybook/react-vite'
import TextareaField from './TextareaField'

const meta = {
  title: 'UI/TextareaField',
  component: TextareaField,
  tags: ['autodocs'],
} satisfies Meta<typeof TextareaField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'default',
    label: 'Instructions',
    placeholder: 'Décrivez les étapes de préparation…',
    rows: 4,
  },
}

export const WithValue: Story = {
  args: {
    id: 'with-value',
    label: 'Notes',
    rows: 4,
    defaultValue:
      'Ajouter une pincée de sel en fin de cuisson pour rehausser les saveurs.',
  },
}

export const WithError: Story = {
  args: {
    id: 'with-error',
    label: 'Instructions',
    rows: 4,
    error: 'Les instructions sont obligatoires.',
  },
}

export const WithHint: Story = {
  args: {
    id: 'with-hint',
    label: 'Ingrédients',
    hint: 'Séparez chaque ingrédient par une virgule.',
    rows: 3,
    placeholder: 'Ex. : 200g de riz, 1 oignon, 30cl de bouillon',
  },
}
