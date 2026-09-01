import type { Meta, StoryObj } from '@storybook/react-vite'
import Spinner from './Spinner'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const OnDarkBackground: Story = {
  args: {
    size: 'md',
    className: 'text-white',
  },
  decorators: [
    (Story) => (
      <div className="flex h-24 w-24 items-center justify-center rounded-card bg-forest">
        <Story />
      </div>
    ),
  ],
}
