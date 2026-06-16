import { render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SummaryStatsCards from '@components/transactions/summaries/SummaryStatsCards'
import { setViewMode } from '@stores/transactionsStore'

// Two debit rows whose page-local sum is 100 — distinct from the server total below.
const ROWS = [
  { amount_debit: 30, amount_credit: 0, budget_category: 'Groceries' },
  { amount_debit: 70, amount_credit: 0, budget_category: 'Rent' },
]

describe('SummaryStatsCards — Total Debits', () => {
  beforeEach(() => {
    // The cards only render when a timeframe filter is active.
    setViewMode('month')
  })
  afterEach(() => {
    setViewMode(null)
  })

  it('prefers the server-side debitTotal over the page-local sum', () => {
    render(() => <SummaryStatsCards transactions={ROWS} debitTotal={1234.56} />)
    const card = screen.getByTestId('summary-debits-card')
    expect(card).toHaveTextContent('$1,234.56')
    expect(card).not.toHaveTextContent('$100.00')
    // Count still reflects the rows actually on the page.
    expect(card).toHaveTextContent('2 expense transactions')
  })

  it('falls back to the page-local sum when debitTotal is absent', () => {
    render(() => <SummaryStatsCards transactions={ROWS} />)
    expect(screen.getByTestId('summary-debits-card')).toHaveTextContent('$100.00')
  })

  it('treats a negative server total as a magnitude', () => {
    render(() => <SummaryStatsCards transactions={ROWS} debitTotal={-500} />)
    expect(screen.getByTestId('summary-debits-card')).toHaveTextContent('$500.00')
  })
})
