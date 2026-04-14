import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import type { Memo } from '@types'
import type { MemosTableSortDir, MemosTableSortKey } from './memosTableSort'
import MemosTableDataTable from './MemosTableDataTable'

const sampleMemos: Memo[] = [
  {
    id: 1,
    name: 'WHOLEFDS MKT',
    recurring: false,
    necessary: true,
    ambiguous: false,
    budget_category: 'Food - Groceries',
    total_amount_debit: 125.43,
    transactions_count: 5,
  },
  {
    id: 2,
    name: 'NETFLIX.COM',
    recurring: true,
    necessary: false,
    ambiguous: false,
    budget_category: 'Entertainment',
    total_amount_debit: 15.99,
    transactions_count: 1,
  },
  {
    id: 3,
    name: 'UBER TRIP',
    recurring: false,
    necessary: false,
    ambiguous: true,
    budget_category: null,
    total_amount_debit: 42.5,
    transactions_count: 3,
  },
  {
    id: 4,
    name: 'RENT PAYMENT',
    recurring: true,
    necessary: true,
    ambiguous: false,
    budget_category: 'Housing - Rent',
    total_amount_debit: 1200.0,
    transactions_count: 1,
  },
]

const meta = {
  title: 'Memos/MemosTableDataTable',
  component: MemosTableDataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MemosTableDataTable>

export default meta
type Story = StoryObj<typeof meta>

export const WithData: Story = {
  render: () => {
    const [sortKey, setSortKey] = createSignal<MemosTableSortKey | null>(null)
    const [sortDir, setSortDir] = createSignal<MemosTableSortDir>('asc')
    return (
      <MemosTableDataTable
        paginatedData={() => sampleMemos}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key) => {
          if (sortKey() === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
          } else {
            setSortKey(key)
            setSortDir('asc')
          }
        }}
        togglingAmbiguousId={() => null}
        mutatingCategoryId={() => null}
        onToggleAmbiguous={() => {}}
        onAssignCategory={() => {}}
      />
    )
  },
}

export const Empty: Story = {
  render: () => (
    <MemosTableDataTable
      paginatedData={() => []}
      sortKey={() => null}
      sortDir={() => 'asc'}
      onSort={() => {}}
      togglingAmbiguousId={() => null}
      mutatingCategoryId={() => null}
      onToggleAmbiguous={() => {}}
      onAssignCategory={() => {}}
    />
  ),
}

export const Sorting: Story = {
  render: () => (
    <MemosTableDataTable
      paginatedData={() => sampleMemos}
      sortKey={() => 'total_amount_debit'}
      sortDir={() => 'desc'}
      onSort={() => {}}
      togglingAmbiguousId={() => null}
      mutatingCategoryId={() => null}
      onToggleAmbiguous={() => {}}
      onAssignCategory={() => {}}
    />
  ),
}
