import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import AppShell from './AppShell'
import Card from './Card'

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/recipes']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">
        Mes recettes
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
              Risotto aux champignons
            </h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              Un classique crémeux et réconfortant.
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
              Salade de chèvre chaud
            </h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              Fraîche et gourmande.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  ),
}

export const EmptyContent: Story = {
  render: () => (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">
        Mes recettes
      </h1>
      <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">
        Aucune recette pour le moment.
      </p>
    </AppShell>
  ),
}
