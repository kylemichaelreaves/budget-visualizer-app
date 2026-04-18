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

export const Default: Story = {
  args: {
    title: 'Total Debits',
    icon: (
      <svg
        class="size-4 text-negative"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 12 12 16 16 12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
    value: <div class="text-2xl font-bold text-negative">-$1,234.56</div>,
    subtitle: '15 expense transactions',
    dataTestId: 'story-summary-stat-card',
  },
}

export const WithSubtitle: Story = {
  args: {
    title: 'Total Credits',
    icon: (
      <svg
        class="size-4 text-positive"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="16" x2="12" y2="8" />
      </svg>
    ),
    value: <div class="text-2xl font-bold text-positive">+$2,500.00</div>,
    subtitle: '3 income transactions',
    dataTestId: 'story-summary-stat-subtitle',
  },
}

export const NoSubtitle: Story = {
  args: {
    title: 'Balance',
    icon: (
      <svg
        class="size-4 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    value: <div class="text-2xl font-bold">$1,265.44</div>,
    dataTestId: 'story-summary-stat-no-subtitle',
  },
}
