import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import SummaryDebitsCard from './SummaryDebitsCard'

const meta = {
  title: 'Transactions/SummaryDebitsCard',
  component: SummaryDebitsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SummaryDebitsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    total: 1234.56,
    count: 15,
  },
}

export const Zero: Story = {
  args: {
    total: 0,
    count: 0,
  },
}

export const SingleTransaction: Story = {
  args: {
    total: 42.99,
    count: 1,
  },
}
