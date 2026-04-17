import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import type { BudgetCategorySummary } from '@types'
import BudgetCategorySunburst from './BudgetCategorySunburst'

const sampleData: BudgetCategorySummary[] = [
  // Parents
  {
    category_id: 1,
    category_name: 'Food',
    full_path: 'Food',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: 'Food',
    total_amount_debit: 450.25,
  },
  {
    category_id: 3,
    category_name: 'Housing',
    full_path: 'Housing',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: 'Housing',
    total_amount_debit: 1200.0,
  },
  {
    category_id: 4,
    category_name: 'Transport',
    full_path: 'Transport',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: 'Transport',
    total_amount_debit: 189.5,
  },
  {
    category_id: 5,
    category_name: 'Entertainment',
    full_path: 'Entertainment',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: 'Entertainment',
    total_amount_debit: 501.01,
  },
  // Children of Food
  {
    category_id: 2,
    category_name: 'Groceries',
    full_path: 'Food - Groceries',
    level: 1,
    parent_id: 1,
    source_id: 1,
    budget_category: 'Food - Groceries',
    total_amount_debit: 320.0,
  },
  {
    category_id: 6,
    category_name: 'Restaurants',
    full_path: 'Food - Restaurants',
    level: 1,
    parent_id: 1,
    source_id: 1,
    budget_category: 'Food - Restaurants',
    total_amount_debit: 130.25,
  },
  // Children of Entertainment
  {
    category_id: 7,
    category_name: 'Subscriptions',
    full_path: 'Entertainment - Subscriptions',
    level: 1,
    parent_id: 5,
    source_id: 1,
    budget_category: 'Entertainment - Subscriptions',
    total_amount_debit: 199.26,
  },
  {
    category_id: 10,
    category_name: 'Events',
    full_path: 'Entertainment - Events',
    level: 1,
    parent_id: 5,
    source_id: 1,
    budget_category: 'Entertainment - Events',
    total_amount_debit: 150.0,
  },
  // Grandchildren of Subscriptions
  {
    category_id: 8,
    category_name: 'Streaming',
    full_path: 'Entertainment - Subscriptions - Streaming',
    level: 2,
    parent_id: 7,
    source_id: 1,
    budget_category: 'Entertainment - Subscriptions - Streaming',
    total_amount_debit: 45.99,
  },
  {
    category_id: 9,
    category_name: 'Tech',
    full_path: 'Entertainment - Subscriptions - Tech',
    level: 2,
    parent_id: 7,
    source_id: 1,
    budget_category: 'Entertainment - Subscriptions - Tech',
    total_amount_debit: 29.99,
  },
]

const meta = {
  title: 'Transactions/BudgetCategorySunburst',
  component: BudgetCategorySunburst,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BudgetCategorySunburst>

export default meta
type Story = StoryObj<typeof meta>

export const WithData: Story = {
  args: {
    data: sampleData,
    dataTestId: 'story-sunburst',
  },
}

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    dataTestId: 'story-sunburst-loading',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    dataTestId: 'story-sunburst-empty',
  },
}

export const WithSliceClick: Story = {
  render: () => {
    const [clicked, setClicked] = createSignal<string | null>(null)
    return (
      <div class="w-80 space-y-2 text-sm">
        <BudgetCategorySunburst
          data={sampleData}
          onSliceClick={(row) => setClicked(row.category_name)}
          dataTestId="story-sunburst-click"
        />
        <p class="text-muted-foreground">Last clicked: {clicked() ?? '—'}</p>
      </div>
    )
  },
}
