import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import SummaryCategoriesCard from './SummaryCategoriesCard'

const meta = {
  title: 'Transactions/SummaryCategoriesCard',
  component: SummaryCategoriesCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SummaryCategoriesCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithCategories: Story = {
  args: {
    categories: [
      ['Food - Groceries', 450.25],
      ['Housing - Rent', 1200.0],
      ['Transport', 89.5],
    ],
  },
}

export const Empty: Story = {
  args: {
    categories: [],
  },
}

export const ManyCategories: Story = {
  args: {
    categories: [
      ['Housing - Rent', 1200.0],
      ['Food - Groceries', 450.25],
      ['Food - Dining', 320.0],
      ['Transport', 189.5],
      ['Utilities', 150.0],
      ['Entertainment', 95.0],
      ['Insurance - Home', 80.0],
      ['Subscriptions', 45.99],
    ],
  },
}
