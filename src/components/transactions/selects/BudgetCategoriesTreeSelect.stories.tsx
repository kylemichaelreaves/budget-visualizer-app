import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { storybookBudgetCategoryHandlers } from '@mocks/storybookBudgetCategoryHandlers'
import BudgetCategoriesTreeSelect from './BudgetCategoriesTreeSelect'

const meta = {
  title: 'Transactions/BudgetCategoriesTreeSelect',
  component: BudgetCategoriesTreeSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [...storybookBudgetCategoryHandlers],
    },
  },
} satisfies Meta<typeof BudgetCategoriesTreeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = createSignal<string | null>(null)
    return (
      <div class="w-96">
        <BudgetCategoriesTreeSelect
          value={value()}
          onChange={setValue}
          placeholder="Choose a category"
          dataTestId="story-budget-cat-select"
        />
      </div>
    )
  },
}

export const Filterable: Story = {
  render: () => {
    const [value, setValue] = createSignal<string | null>('Food - Groceries')
    return (
      <div class="w-96">
        <BudgetCategoriesTreeSelect
          value={value()}
          onChange={setValue}
          filterable
          placeholder="Filter and pick…"
          dataTestId="story-budget-cat-filterable"
        />
      </div>
    )
  },
}

export const NotClearable: Story = {
  render: () => {
    const [value, setValue] = createSignal<string | null>('Housing - Rent')
    return (
      <div class="w-96">
        <BudgetCategoriesTreeSelect
          value={value()}
          onChange={setValue}
          clearable={false}
          dataTestId="story-budget-cat-required"
        />
      </div>
    )
  },
}
