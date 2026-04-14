import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { storybookBudgetCategoryHandlers } from '@mocks/storybookBudgetCategoryHandlers'
import type { SplitBudgetCategory } from '@types'
import SplitBudgetCategoryDrawer from './SplitBudgetCategoryDrawer'

const meta = {
  title: 'Transactions/SplitBudgetCategoryDrawer',
  component: SplitBudgetCategoryDrawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [...storybookBudgetCategoryHandlers],
    },
  },
} satisfies Meta<typeof SplitBudgetCategoryDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true)
    const [log, setLog] = createSignal<string[]>([])
    return (
      <div class="space-y-2 text-sm">
        <button
          type="button"
          class="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          Open drawer
        </button>
        <SplitBudgetCategoryDrawer
          open={open()}
          splits={[{ id: '1', budget_category_id: '', amount_debit: 0 }]}
          transactionAmount={150.0}
          transactionType="debit"
          transactionDescription="WHOLEFDS MKT #10234"
          transactionDate="2025-01-15"
          transactionCategory="Food - Groceries"
          onSubmit={(splits) => {
            setLog((prev) => [...prev, `Saved ${splits.length} split(s)`])
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
        <p class="text-muted-foreground">Log: {log().length ? log().join(' | ') : '—'}</p>
      </div>
    )
  },
}

export const WithExistingSplits: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true)
    const existingSplits: SplitBudgetCategory[] = [
      { id: '1', budget_category_id: 'Food', amount_debit: 80.0 },
      { id: '2', budget_category_id: 'Housing', amount_debit: 70.0 },
    ]
    return (
      <div>
        <button
          type="button"
          class="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          Open drawer
        </button>
        <SplitBudgetCategoryDrawer
          open={open()}
          splits={existingSplits}
          transactionAmount={150.0}
          transactionType="debit"
          transactionDescription="WHOLEFDS MKT #10234"
          onSubmit={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          onClear={() => {}}
        />
      </div>
    )
  },
}

export const CreditTransaction: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true)
    return (
      <div>
        <button
          type="button"
          class="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          Open drawer
        </button>
        <SplitBudgetCategoryDrawer
          open={open()}
          splits={[{ id: '1', budget_category_id: '', amount_debit: 0 }]}
          transactionAmount={500.0}
          transactionType="credit"
          transactionDescription="EMPLOYER DIRECT DEPOSIT"
          transactionDate="2025-01-31"
          onSubmit={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    )
  },
}
