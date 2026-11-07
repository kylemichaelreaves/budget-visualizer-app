import { MemoryRouter, Route } from '@solidjs/router'
import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import type { Memo, Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'

const memoRequests = vi.hoisted(() => [] as (number | null)[])
const memoById = vi.hoisted(() => new Map<number, Memo>())

// Stands in for the memo request: records which memo the row asked for, answers from `memoById`.
vi.mock('@api/hooks/memos/useMemoById', () => ({
  useMemoById: (params: { memoId: () => number | null }) => ({
    get data() {
      const id = params.memoId()
      memoRequests.push(id)
      return id == null ? undefined : memoById.get(id)
    },
  }),
}))

const { default: TransactionsTableRow } = await import('@components/transactions/table/TransactionsTableRow')

const categoryColors = budgetCategoryColorsFromData([])

function makeRow(fields: Partial<Transaction>): Transaction {
  return {
    id: 1,
    transaction_number: 'T1',
    date: '2026-05-01',
    description: 'Coffee',
    memo: 'Cafe',
    memo_id: 7,
    amount_debit: '-4.50',
    amount_credit: '0',
    budget_category: 'Food',
    ...fields,
  }
}

function renderRow(row: Transaction, opts: { memo?: Memo; openSplitDrawer?: (r: Transaction) => void } = {}) {
  memoRequests.length = 0
  memoById.clear()
  if (opts.memo) memoById.set(opts.memo.id, opts.memo)
  const openSplitDrawer = opts.openSplitDrawer ?? vi.fn()
  render(() => (
    <MemoryRouter
      root={() => (
        <ul>
          <TransactionsTableRow
            row={row}
            categoryColors={() => categoryColors}
            mutatingTransactionId={() => null}
            openCategoryDialog={vi.fn()}
            openSplitDrawer={openSplitDrawer}
          />
        </ul>
      )}
    >
      <Route path="*" component={() => null} />
    </MemoryRouter>
  ))
  return { openSplitDrawer }
}

const ambiguityIcon = () => screen.queryByTestId('memo-ambiguity-1')
const splitButton = () => screen.queryByTestId('split-button-1')

describe('TransactionsTableRow memo ambiguity', () => {
  it('shows the ambiguity icon and split button from the row flag, without a memo request', () => {
    renderRow(makeRow({ memo_ambiguous: true }))
    expect(ambiguityIcon()).toBeInTheDocument()
    expect(splitButton()).toBeInTheDocument()
    expect(memoRequests.every((id) => id == null)).toBe(true)
  })

  it.each([false, null])('hides both when the row says memo_ambiguous=%s', (flag) => {
    // The memo would say ambiguous; the row's own flag wins.
    renderRow(makeRow({ memo_ambiguous: flag }), {
      memo: { id: 7, name: 'Cafe', recurring: false, necessary: false, ambiguous: true },
    })
    expect(ambiguityIcon()).not.toBeInTheDocument()
    expect(splitButton()).not.toBeInTheDocument()
  })

  it('falls back to the memo when the row has no flag', () => {
    renderRow(makeRow({}), {
      memo: { id: 7, name: 'Cafe', recurring: false, necessary: false, ambiguous: true },
    })
    expect(memoRequests).toContain(7)
    expect(ambiguityIcon()).toBeInTheDocument()
    expect(splitButton()).toBeInTheDocument()
  })

  it('offers no split for an ambiguous memo with no category assigned yet', () => {
    renderRow(makeRow({ memo_ambiguous: true, budget_category: null }))
    expect(ambiguityIcon()).toBeInTheDocument()
    expect(splitButton()).not.toBeInTheDocument()
    expect(screen.getByTestId('assign-category-1')).toBeInTheDocument()
  })

  it('opens the split drawer for the row', () => {
    const row = makeRow({ memo_ambiguous: true })
    const { openSplitDrawer } = renderRow(row)
    splitButton()!.click()
    expect(openSplitDrawer).toHaveBeenCalledWith(row)
  })
})
