import { MemoryRouter, Route } from '@solidjs/router'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import type { JSX } from 'solid-js'
import { createMemo, createSignal } from 'solid-js'
import TimeframeSummaryTable, { type TimeframeSummaryRow } from './TimeframeSummaryTable'

function WithRouter(props: { children: JSX.Element }) {
  return (
    <MemoryRouter root={(r) => r.children}>
      <Route path="/" component={() => props.children} />
    </MemoryRouter>
  )
}

const sampleRows: TimeframeSummaryRow[] = [
  { memo: '42', budget_category: 'Food - Groceries', amount: 12.5 },
  { memo: 'Plain text memo', budget_category: null, amount: 3 },
  { memo: '7', budget_category: 'Transport', amount: 99 },
]

const meta = {
  title: 'Transactions/TimeframeSummaryTable',
  component: TimeframeSummaryTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TimeframeSummaryTable>

export default meta
type Story = StoryObj<typeof meta>

export const MonthWithData: Story = {
  render: () => {
    const rows = createMemo(() => sampleRows)
    return (
      <WithRouter>
        <TimeframeSummaryTable
          dataTestId="story-month-summary"
          titleVerb="Month"
          selectedPeriod={() => '01-2025'}
          amountHeader="Total debit"
          loadingMessage="Loading month summary…"
          memoLinkTestId="story-month-summary-memo-link"
          rows={rows}
          isError={() => false}
          error={() => undefined}
          isLoading={() => false}
          isFetching={() => false}
          showTable={() => true}
        />
      </WithRouter>
    )
  },
}

export const WeekWithData: Story = {
  render: () => {
    const rows = createMemo(() => sampleRows.slice(0, 2))
    return (
      <WithRouter>
        <TimeframeSummaryTable
          dataTestId="story-week-summary"
          titleVerb="Week"
          selectedPeriod={() => '03-2025'}
          amountHeader="Weekly debit"
          loadingMessage="Loading week summary…"
          memoLinkTestId="story-week-summary-memo-link"
          rows={rows}
          isError={() => false}
          error={() => undefined}
          isLoading={() => false}
          isFetching={() => false}
          showTable={() => true}
        />
      </WithRouter>
    )
  },
}

export const Empty: Story = {
  render: () => {
    const rows = createMemo((): TimeframeSummaryRow[] => [])
    return (
      <WithRouter>
        <TimeframeSummaryTable
          dataTestId="story-summary-empty"
          titleVerb="Month"
          selectedPeriod={() => '12-2024'}
          amountHeader="Total debit"
          loadingMessage="Loading…"
          memoLinkTestId="story-empty-memo-link"
          rows={rows}
          isError={() => false}
          error={() => undefined}
          isLoading={() => false}
          isFetching={() => false}
          showTable={() => true}
        />
      </WithRouter>
    )
  },
}

export const Loading: Story = {
  render: () => {
    const rows = createMemo((): TimeframeSummaryRow[] => [])
    return (
      <WithRouter>
        <TimeframeSummaryTable
          dataTestId="story-summary-loading"
          titleVerb="Month"
          selectedPeriod={() => '01-2025'}
          amountHeader="Total debit"
          loadingMessage="Loading month summary…"
          memoLinkTestId="story-loading-memo-link"
          rows={rows}
          isError={() => false}
          error={() => undefined}
          isLoading={() => true}
          isFetching={() => false}
          showTable={() => false}
        />
      </WithRouter>
    )
  },
}

export const ErrorState: Story = {
  render: () => {
    const [err] = createSignal(new Error('Network failed'))
    const rows = createMemo((): TimeframeSummaryRow[] => [])
    return (
      <WithRouter>
        <TimeframeSummaryTable
          dataTestId="story-summary-error"
          titleVerb="Month"
          selectedPeriod={() => '01-2025'}
          amountHeader="Total debit"
          loadingMessage="Loading…"
          memoLinkTestId="story-error-memo-link"
          rows={rows}
          isError={() => true}
          error={err}
          isLoading={() => false}
          isFetching={() => false}
          showTable={() => false}
        />
      </WithRouter>
    )
  },
}

export const NoSelectedPeriod: Story = {
  render: () => {
    const rows = createMemo(() => sampleRows)
    return (
      <WithRouter>
        <div class="text-muted-foreground text-sm">
          <p class="mb-2">Nothing below when `selectedPeriod` is empty:</p>
          <TimeframeSummaryTable
            dataTestId="story-summary-no-period"
            titleVerb="Month"
            selectedPeriod={() => undefined}
            amountHeader="Total debit"
            loadingMessage="Loading…"
            memoLinkTestId="story-no-period-memo-link"
            rows={rows}
            isError={() => false}
            error={() => undefined}
            isLoading={() => false}
            isFetching={() => false}
            showTable={() => true}
          />
        </div>
      </WithRouter>
    )
  },
}
