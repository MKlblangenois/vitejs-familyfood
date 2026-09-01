import type { Meta, StoryObj } from '@storybook/react-vite'
import LoadingSkeleton from './LoadingSkeleton'

const meta = {
  title: 'UI/LoadingSkeleton',
  component: LoadingSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    className: 'h-40 w-full',
  },
}

export const WithLines: Story = {
  args: {
    lines: 4,
  },
}

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-sm rounded-card border border-sand-200 bg-white p-6 shadow-card dark:border-white/10 dark:bg-forest-900">
      <LoadingSkeleton className="h-32 w-full" />
      <div className="mt-4 space-y-3">
        <LoadingSkeleton className="h-5 w-3/4" />
        <LoadingSkeleton lines={3} />
      </div>
    </div>
  ),
}
