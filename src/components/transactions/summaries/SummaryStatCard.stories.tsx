import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import SummaryStatCard from './SummaryStatCard'

const meta = {
  title: 'Transactions/SummaryStatCard',
  component: SummaryStatCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SummaryStatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Debits: Story = {
  args: { variant: 'debit', total: 1234.56, count: 15 },
}

export const Credits: Story = {
  args: { variant: 'credit', total: 2500, count: 3 },
}

export const SingleTransaction: Story = {
  args: { variant: 'debit', total: 42, count: 1 },
}
