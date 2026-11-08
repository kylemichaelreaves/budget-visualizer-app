import { render, screen } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { describe, expect, it } from 'vitest'
import MemoSummaryHeader from '@components/memos/summaries/MemoSummaryHeader'

function renderHeader(flags: {
  ambiguous?: boolean
  resolved?: boolean
  recurring?: boolean
  frequency?: string
  name?: string
  count?: number
}) {
  return render(() => (
    <MemoryRouter
      root={() => (
        <MemoSummaryHeader
          memoId="42"
          memoName={() => flags.name}
          transactionsCount={() => flags.count}
          isAmbiguous={() => flags.ambiguous ?? false}
          isResolved={() => flags.resolved ?? false}
          isRecurring={() => flags.recurring ?? false}
          frequency={() => flags.frequency}
        />
      )}
    >
      <Route path="*" component={() => null} />
    </MemoryRouter>
  ))
}

describe('MemoSummaryHeader', () => {
  it('shows no status badges for a plain memo', () => {
    renderHeader({})
    expect(screen.queryByTestId('memo-summary-ambiguous-badge')).not.toBeInTheDocument()
    expect(screen.queryByTestId('memo-summary-resolved-badge')).not.toBeInTheDocument()
    expect(screen.queryByTestId('memo-summary-recurring-badge')).not.toBeInTheDocument()
  })

  it('falls back to the memo id and an ellipsis count while loading', () => {
    renderHeader({})
    expect(screen.getByTestId('memo-summary-title')).toHaveTextContent('Memo 42')
    expect(screen.getByTestId('memo-summary-tx-count')).toHaveTextContent('... transactions')
  })

  it('shows every badge that applies', () => {
    renderHeader({
      ambiguous: true,
      resolved: true,
      recurring: true,
      frequency: 'monthly',
      name: 'Rent',
      count: 3,
    })
    expect(screen.getByTestId('memo-summary-title')).toHaveTextContent('Rent')
    expect(screen.getByTestId('memo-summary-tx-count')).toHaveTextContent('3 transactions')
    expect(screen.getByTestId('memo-summary-ambiguous-badge')).toHaveTextContent('Ambiguous')
    expect(screen.getByTestId('memo-summary-resolved-badge')).toHaveTextContent('Resolved')
    expect(screen.getByTestId('memo-summary-recurring-badge')).toHaveTextContent('monthly')
  })

  it('labels a recurring memo with no frequency as "Recurring"', () => {
    renderHeader({ recurring: true })
    expect(screen.getByTestId('memo-summary-recurring-badge')).toHaveTextContent('Recurring')
  })
})
