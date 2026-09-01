import type { Meta, StoryObj } from '@storybook/react-vite'
import Card from './Card'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    interactive: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
          Recette du jour
        </h3>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Une simple carte pour afficher du contenu.
        </p>
      </div>
    ),
  },
}

export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
          Carte interactive
        </h3>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Survolez cette carte pour voir l&apos;effet de survol.
        </p>
      </div>
    ),
  },
}

export const CustomContent: Story = {
  args: {
    children: (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
            Liste de courses
          </h3>
          <span className="rounded-pill bg-citrus-100 px-2.5 py-0.5 text-xs font-medium text-ink">
            3 articles
          </span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-ink-600 dark:text-ink-300">
          <li>• Tomates</li>
          <li>• Basilic frais</li>
          <li>• Mozzarella</li>
        </ul>
      </div>
    ),
  },
}
