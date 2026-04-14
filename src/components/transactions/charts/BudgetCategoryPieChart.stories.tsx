import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import type { BudgetCategorySummary } from '@types'
import BudgetCategoryPieChart from './BudgetCategoryPieChart'

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
    category_name: 'Utilities',
    full_path: 'Utilities',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: 'Utilities',
    total_amount_debit: 150.0,
  },
]

const meta = {
  title: 'Transactions/BudgetCategoryPieChart',
  component: BudgetCategoryPieChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BudgetCategoryPieChart>

export default meta
type Story = StoryObj<typeof meta>

export const WithData: Story = {
  args: {
    data: sampleData,
    dataTestId: 'story-pie-chart',
  },
}

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    dataTestId: 'story-pie-chart-loading',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    dataTestId: 'story-pie-chart-empty',
  },
}

export const WithSliceClick: Story = {
  render: () => {
    const [clicked, setClicked] = createSignal<string | null>(null)
    return (
      <div class="w-80 space-y-2 text-sm">
        <BudgetCategoryPieChart
          data={sampleData}
          onSliceClick={(row) => setClicked(row.category_name)}
          dataTestId="story-pie-chart-click"
        />
        <p class="text-muted-foreground">Last clicked: {clicked() ?? '—'}</p>
      </div>
    )
  },
}

export const NoLegend: Story = {
  args: {
    data: sampleData,
    showLegend: false,
    dataTestId: 'story-pie-chart-no-legend',
  },
}
