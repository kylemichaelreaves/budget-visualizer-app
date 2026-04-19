import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createMemo, createSignal } from 'solid-js'
import type { BudgetCategorySummary } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import BudgetCategoryTreemap from './BudgetCategoryTreemap'

const sampleData: BudgetCategorySummary[] = [
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
  title: 'Transactions/BudgetCategoryTreemap',
  component: BudgetCategoryTreemap,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '560px', height: '360px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BudgetCategoryTreemap>

export default meta
type Story = StoryObj<typeof meta>

const colorsFor = (rows: BudgetCategorySummary[]) => createMemo(() => budgetCategoryColorsFromData(rows))

export const WithData: Story = {
  args: {
    data: sampleData,
    categoryColors: colorsFor(sampleData),
    dataTestId: 'story-treemap',
  },
}

export const Loading: Story = {
  args: {
    data: [],
    categoryColors: colorsFor([]),
    isLoading: true,
    dataTestId: 'story-treemap-loading',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    categoryColors: colorsFor([]),
    dataTestId: 'story-treemap-empty',
  },
}

export const WithPeriodLabel: Story = {
  args: {
    data: sampleData,
    categoryColors: colorsFor(sampleData),
    timeFrame: 'month',
    date: '2026-03',
    dataTestId: 'story-treemap-period',
  },
}

export const WithCellClick: Story = {
  render: () => {
    const [clicked, setClicked] = createSignal<string | null>(null)
    const colors = colorsFor(sampleData)
    return (
      <div class="space-y-2 text-sm">
        <div style={{ width: '560px', height: '360px' }}>
          <BudgetCategoryTreemap
            data={sampleData}
            categoryColors={colors}
            onCellClick={(row) => setClicked(row.category_name)}
            dataTestId="story-treemap-click"
          />
        </div>
        <p class="text-muted-foreground">Last clicked: {clicked() ?? '—'}</p>
      </div>
    )
  },
}
