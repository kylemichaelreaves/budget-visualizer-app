import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import type { DailyInterval, SummaryTypeBase } from '@types'
import LineChart from './LineChart'

// ── Sample data generators ────────────────────────────────────────────────────

function generateDailyData(days: number): DailyInterval[] {
  const data: DailyInterval[] = []
  const base = new Date('2026-03-01T00:00:00.000Z')
  for (let i = 0; i < days; i++) {
    const date = new Date(base)
    date.setUTCDate(base.getUTCDate() + i)
    data.push({
      date,
      total_amount_debit: Math.round((Math.random() * 200 + 20) * 100) / 100,
    })
  }
  return data
}

function generateMonthlyData(months: number): SummaryTypeBase[] {
  const data: SummaryTypeBase[] = []
  const startYear = 2025
  const startMonth = 5
  for (let i = 0; i < months; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1
    const y = startYear + Math.floor((startMonth - 1 + i) / 12)
    const dt = new Date(Date.UTC(y, m - 1, 1))
    data.push({
      period_start: dt.toISOString(),
      total_debit: Math.round((Math.random() * 3000 + 800) * 100) / 100,
      year: String(y),
      month_number: String(m),
    })
  }
  return data
}

const dailyData = generateDailyData(30)
const monthlyData = generateMonthlyData(12)

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ───────────────────────────────────────────────────────────────────

export const DailyData: Story = {
  args: {
    summaries: dailyData,
    handleOnClickSelection: () => undefined,
    dataTestId: 'story-line-chart-daily',
  },
}

export const HistoricalMonthly: Story = {
  args: {
    summaries: monthlyData,
    handleOnClickSelection: () => undefined,
    stackedDateLabels: true,
    dataTestId: 'story-line-chart-monthly',
  },
}

export const Loading: Story = {
  args: {
    summaries: [],
    handleOnClickSelection: () => undefined,
    loading: true,
    dataTestId: 'story-line-chart-loading',
  },
}

export const Empty: Story = {
  args: {
    summaries: [],
    handleOnClickSelection: () => undefined,
    dataTestId: 'story-line-chart-empty',
  },
}

export const WithClickHandler: Story = {
  render: () => {
    const [clicked, setClicked] = createSignal<string | null>(null)
    return (
      <div class="space-y-2 text-sm">
        <LineChart
          summaries={dailyData}
          handleOnClickSelection={(date) => setClicked(date)}
          dataTestId="story-line-chart-click"
        />
        <p class="text-muted-foreground">Last clicked: {clicked() ?? '—'}</p>
      </div>
    )
  },
}
