import type { Meta, StoryObj } from '@storybook/react-vite'
import LoyaltyCardItem from './components/LoyaltyCardItem'

const meta = {
  title: 'LoyaltyCards/LoyaltyCardItem',
  component: LoyaltyCardItem,
  args: {
    card: {
      id: 'card-1',
      user_id: 'user-1',
      store_name: 'Marché du quartier',
      barcode_value: null,
      barcode_format: null,
      card_color: '#4f7c63',
      logo_url: null,
      position: 0,
      created_at: '',
      updated_at: '',
    },
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="grid max-w-sm grid-cols-2 gap-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoyaltyCardItem>
export default meta
export const Default: StoryObj<typeof meta> = {}
