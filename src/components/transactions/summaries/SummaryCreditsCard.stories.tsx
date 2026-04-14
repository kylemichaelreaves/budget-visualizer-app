import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import SummaryCreditsCard from './SummaryCreditsCard'

const meta = {
  title: 'Transactions/SummaryCreditsCard',
  component: SummaryCreditsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SummaryCreditsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    total: 2500.0,
    count: 3,
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
    total: 1500.75,
    count: 1,
  },
}
