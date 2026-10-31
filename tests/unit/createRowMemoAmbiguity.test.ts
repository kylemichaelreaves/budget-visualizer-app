import { describe, expect, it, vi } from 'vitest'
import { createRoot, createSignal } from 'solid-js'
import type { Memo, Transaction } from '@types'

let memoId!: () => number | null
let memoData: Memo | undefined

vi.mock('@api/hooks/memos/useMemoById', () => ({
  useMemoById: (params: { memoId: () => number | null }) => {
    memoId = params.memoId
    return {
      get data() {
        return memoData
      },
    }
  },
}))

const { createRowMemoAmbiguity } = await import('@components/transactions/table/createRowMemoAmbiguity')

function row(fields: Partial<Transaction>): Transaction {
  return {
    date: '2026-05-01',
    description: 'X',
    memo: 'M',
    amount_debit: '-1',
    amount_credit: '0',
    ...fields,
  }
}

function ambiguity(r: Transaction, memo?: Memo) {
  memoData = memo
  return createRoot(() => createRowMemoAmbiguity(() => r))
}

const memo = (ambiguous: boolean): Memo => ({
  id: 7,
  name: 'M',
  recurring: false,
  necessary: false,
  ambiguous,
})

describe('createRowMemoAmbiguity', () => {
  it.each([
    [true, true],
    [false, false],
    [null, false],
  ])('reads memo_ambiguous=%s from the row and fetches no memo', (flag, expected) => {
    // The memo would say otherwise; the row's own flag wins.
    const isAmbiguous = ambiguity(row({ memo_id: 7, memo_ambiguous: flag }), memo(!expected))
    expect(isAmbiguous()).toBe(expected)
    expect(memoId()).toBeNull()
  })

  it('falls back to the memo when the backend predates memo_ambiguous', () => {
    const isAmbiguous = ambiguity(row({ memo_id: 7 }), memo(true))
    expect(memoId()).toBe(7)
    expect(isAmbiguous()).toBe(true)
  })

  it('fetches nothing for a row with no memo and no flag', () => {
    const isAmbiguous = ambiguity(row({}))
    expect(memoId()).toBeNull()
    expect(isAmbiguous()).toBe(false)
  })

  it('stops fetching once the row gains the flag', () => {
    const [r, setR] = createSignal(row({ memo_id: 7 }))
    memoData = memo(false)
    const isAmbiguous = createRoot(() => createRowMemoAmbiguity(r))
    expect(memoId()).toBe(7)
    setR(row({ memo_id: 7, memo_ambiguous: true }))
    expect(memoId()).toBeNull()
    expect(isAmbiguous()).toBe(true)
  })
})
