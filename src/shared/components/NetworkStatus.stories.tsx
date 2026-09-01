import type { Meta, StoryObj } from '@storybook/react-vite'
import NetworkStatus from './NetworkStatus'

const meta = {
  title: 'UI/NetworkStatus',
  component: NetworkStatus,
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Online: Story = {
  render: () => (
    <div className="p-6">
      <p className="text-sm text-ink-500 dark:text-ink-300">
        Vous êtes actuellement en ligne. Le composant ne rend rien dans cet
        état. Passez votre navigateur hors ligne pour voir la bannière.
      </p>
    </div>
  ),
}

export const Offline: Story = {
  render: () => (
    <div className="p-6">
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-300">
        Simulation de l&apos;état hors ligne : la bannière s&apos;affiche en
        haut de l&apos;écran.
      </p>
      <NetworkStatus />
    </div>
  ),
  decorators: [
    (Story) => {
      // Stub navigator.onLine to simulate an offline connection before mount.
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => false,
      })
      return <Story />
    },
  ],
}
