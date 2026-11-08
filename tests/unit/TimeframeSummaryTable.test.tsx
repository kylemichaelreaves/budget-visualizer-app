import { fireEvent, render, screen, within } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { describe, expect, it } from 'vitest'
import TimeframeSummaryTable, {
  type TimeframeSummaryRow,
} from '@components/transactions/summaries/TimeframeSummaryTable'

const ID = 'month-summary-table'

function renderTable(state: {
  rows?: TimeframeSummaryRow[]
  isLoading?: boolean
  showTable?: boolean
  error?: unknown
  period?: string | null
}) {
  return render(() => (
    <MemoryRouter
      root={() => (
        <TimeframeSummaryTable
          dataTestId={ID}
          titleVerb="Month"
          selectedPeriod={() => (state.period === undefined ? '03-2026' : state.period)}
          amountHeader="Amount"
          loadingMessage="Loading month summary..."
          memoLinkTestId="month-summary-memo-link"
          rows={() => state.rows ?? []}
          isError={() => state.error !== undefined}
          error={() => state.error}
          isLoading={() => state.isLoading ?? false}
          isFetching={() => false}
          showTable={() => state.showTable ?? false}
          getCategoryColor={(name) => (name === 'Food' ? '#ff0000' : undefined)}
        />
      )}
    >
      <Route path="*" component={() => null} />
    </MemoryRouter>
  ))
}

const rows: TimeframeSummaryRow[] = [
  { memo: 'Coffee', budget_category: 'Food', amount: 5, count: 2 },
  { memo: '17', budget_category: null, amount: 40 },
  { memo: 'Books', budget_category: 'Leisure', amount: 20, count: 3 },
]

function memoColumn() {
  const body = screen.getByTestId(`${ID}-data`).querySelector('tbody')!
  return Array.from(body.querySelectorAll('tr')).map((tr) => tr.querySelector('td')!.textContent)
}

describe('TimeframeSummaryTable', () => {
  it('renders nothing without a selected period', () => {
    renderTable({ period: null, showTable: true, rows })
    expect(screen.queryByTestId(ID)).not.toBeInTheDocument()
  })

  it('shows the loading message while loading', () => {
    renderTable({ isLoading: true })
    expect(screen.getByTestId(`${ID}-loading`)).toHaveTextContent('Loading month summary...')
    expect(screen.queryByTestId(`${ID}-data`)).not.toBeInTheDocument()
  })

  it('shows an error alert', () => {
    renderTable({ error: 'boom' })
    expect(screen.getByTestId(`${ID}-error`)).toHaveTextContent('boom')
  })

  it('shows the empty message when there are no rows', () => {
    renderTable({ showTable: true, rows: [] })
    expect(screen.getByText('No expense transactions for this period.')).toBeInTheDocument()
  })

  it('renders rows sorted by amount descending, with totals', () => {
    renderTable({ showTable: true, rows })
    const table = screen.getByTestId(`${ID}-data`)
    expect(memoColumn()).toEqual(['17', 'Books', 'Coffee'])
    // Numeric memos link to their summary page.
    expect(within(table).getByTestId('month-summary-memo-link')).toHaveAttribute(
      'href',
      '/budget-visualizer/memos/17/summary',
    )
    const foot = table.querySelector('tfoot')!
    expect(foot).toHaveTextContent('6')
    expect(foot).toHaveTextContent('$65.00')
    expect(screen.getByText(/3 memos · 6 transaction/)).toBeInTheDocument()
  })

  it('re-sorts when a header is clicked, toggling direction on repeat', () => {
    renderTable({ showTable: true, rows })
    const headers = screen.getByTestId(`${ID}-data`).querySelectorAll('th')

    fireEvent.click(headers[0]!) // memo, asc
    expect(memoColumn()).toEqual(['17', 'Books', 'Coffee'])
    fireEvent.click(headers[0]!) // memo, desc
    expect(memoColumn()).toEqual(['Coffee', 'Books', '17'])

    fireEvent.click(headers[1]!) // category, asc (null sorts first)
    expect(memoColumn()).toEqual(['17', 'Coffee', 'Books'])

    fireEvent.click(headers[2]!) // count, desc
    expect(memoColumn()).toEqual(['Books', 'Coffee', '17'])
  })
})
