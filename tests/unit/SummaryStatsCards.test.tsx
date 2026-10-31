import { render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SummaryStatsCards from '@components/transactions/summaries/SummaryStatsCards'
import { setViewMode } from '@stores/transactionsStore'

// The loaded window: two debits and one credit, summing to $100 / $40.
const ROWS = [
  { amount_debit: -30, amount_credit: 0, budget_category: 'Groceries' },
  { amount_debit: -70, amount_credit: 0, budget_category: 'Rent' },
  { amount_debit: 0, amount_credit: 40, budget_category: null },
]

const debitsCard = () => screen.getByTestId('summary-debits-card')
const creditsCard = () => screen.getByTestId('summary-credits-card')
const categoriesCard = () => screen.getByTestId('summary-categories-card')

describe('SummaryStatsCards', () => {
  beforeEach(() => {
    // The cards only render while a filter is active.
    setViewMode('month')
  })
  afterEach(() => {
    setViewMode(null)
  })

  // #82: the total came from the server and the count from the loaded pages.
  it('takes every debit and credit figure from the server totals', () => {
    render(() => (
      <SummaryStatsCards
        transactions={ROWS}
        totals={{ debitTotal: 4210, debitCount: 87, creditTotal: 5000, creditCount: 3 }}
      />
    ))
    expect(debitsCard()).toHaveTextContent('$4,210.00')
    expect(debitsCard()).toHaveTextContent('87 expense transactions')
    expect(creditsCard()).toHaveTextContent('$5,000.00')
    expect(creditsCard()).toHaveTextContent('3 income transactions')
  })

  it('takes the category breakdown from the server, not the loaded rows', () => {
    render(() => (
      <SummaryStatsCards
        transactions={ROWS}
        categories={[
          ['Rent', 1500],
          ['Travel', 900],
        ]}
      />
    ))
    expect(categoriesCard()).toHaveTextContent('Travel')
    expect(categoriesCard()).toHaveTextContent('$1,500.00')
    expect(categoriesCard()).not.toHaveTextContent('Groceries')
  })

  it('shows zero from the server rather than falling back to the loaded rows', () => {
    render(() => (
      <SummaryStatsCards
        transactions={ROWS}
        totals={{ debitTotal: 0, debitCount: 0, creditTotal: 0, creditCount: 0 }}
        categories={[]}
      />
    ))
    expect(debitsCard()).toHaveTextContent('0 expense transactions')
    expect(creditsCard()).toHaveTextContent('0 income transactions')
    expect(categoriesCard()).toHaveTextContent('No categorised expenses')
  })

  // A backend from before the credit and count fields sends only the debit sum.
  it('falls back field by field when the server sends only the debit total', () => {
    render(() => <SummaryStatsCards transactions={ROWS} totals={{ debitTotal: 1234.56 }} />)
    expect(debitsCard()).toHaveTextContent('$1,234.56')
    expect(debitsCard()).toHaveTextContent('2 expense transactions')
    expect(creditsCard()).toHaveTextContent('$40.00')
    expect(creditsCard()).toHaveTextContent('1 income transaction')
  })

  it('uses the loaded rows while the aggregates are still loading', () => {
    render(() => <SummaryStatsCards transactions={ROWS} />)
    expect(debitsCard()).toHaveTextContent('$100.00')
    expect(categoriesCard()).toHaveTextContent('Groceries')
  })

  it('renders nothing without an active filter', () => {
    setViewMode(null)
    render(() => <SummaryStatsCards transactions={ROWS} totals={{ debitTotal: 1 }} />)
    expect(screen.queryByTestId('summary-debits-card')).toBeNull()
  })
})
