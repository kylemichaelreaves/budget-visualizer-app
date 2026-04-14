import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import TableSkeleton from './TableSkeleton'

const meta = {
  title: 'Shared/TableSkeleton',
  component: TableSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TableSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: [
      { prop: 'date', label: 'Date' },
      { prop: 'description', label: 'Description' },
      { prop: 'memo', label: 'Memo' },
      { prop: 'amount_debit', label: 'Debit' },
      { prop: 'amount_credit', label: 'Credit' },
      { prop: 'budget_category', label: 'Category' },
    ],
    dataTestId: 'story-table-skeleton',
  },
}

export const FewColumns: Story = {
  args: {
    columns: [
      { prop: 'id', label: 'ID' },
      { prop: 'memo', label: 'Memo' },
    ],
    rows: 5,
    dataTestId: 'story-table-skeleton-few',
  },
}

export const CustomRowCount: Story = {
  args: {
    columns: [
      { prop: 'date', label: 'Date' },
      { prop: 'description', label: 'Description' },
      { prop: 'amount_debit', label: 'Amount' },
    ],
    rows: 3,
    dataTestId: 'story-table-skeleton-custom',
  },
}
