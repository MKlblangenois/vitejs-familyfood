import type { Meta, StoryObj } from '@storybook/react-vite'
import ProgressBar from './ProgressBar'

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    value: 0,
  },
}

export const Halfway: Story = {
  args: {
    value: 50,
  },
}

export const Complete: Story = {
  args: {
    value: 100,
  },
}

export const Quarter: Story = {
  args: {
    value: 25,
  },
}

export const ThreeQuarters: Story = {
  args: {
    value: 75,
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700 dark:text-ink-200">
          Progression
        </span>
        <span className="text-ink-500 dark:text-ink-300">{args.value}%</span>
      </div>
      <ProgressBar value={args.value} />
    </div>
  ),
  args: {
    value: 60,
  },
}
