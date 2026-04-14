import { describe, expect, it } from 'vitest'
import type { MemoSummary, Transaction } from '@types'
import { computeTotalCredits, computeTotalDebits } from '@components/memos/summaries/memoSummaryTableUtils'

const txn = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  transaction_number: 'TXN-001',
  date: '2026-01-15',
  amount_debit: '0',
  amount_credit: '0',
  description: 'Test',
  memo: 'test',
  memo_id: null,
  budget_category: null,
  balance: '0',
  check_number: undefined,
  fees: undefined,
  is_split: false,
  ...overrides,
})

describe('computeTotalCredits', () => {
  it('returns API-level aggregate when sum_amount_credit is present', () => {
    const summary: MemoSummary = { sum_amount_debit: 100, transactions_count: 5, sum_amount_credit: 200 }
    const result = computeTotalCredits(summary, [])
    expect(result).toEqual({ sum: 200, creditTxnCount: null, aggregateScope: 'memo' })
  })

  it('falls back to page-level sum when sum_amount_credit is absent', () => {
    const summary: MemoSummary = { sum_amount_debit: 100, transactions_count: 5 }
    const txns = [txn({ amount_credit: '25.50' }), txn({ amount_credit: '10.00' })]
    const result = computeTotalCredits(summary, txns)
    expect(result).toEqual({ sum: 35.5, creditTxnCount: 2, aggregateScope: 'page' })
  })

  it('falls back to page-level sum when summary is undefined', () => {
    const txns = [txn({ amount_credit: '15.00' })]
    const result = computeTotalCredits(undefined, txns)
    expect(result).toEqual({ sum: 15, creditTxnCount: 1, aggregateScope: 'page' })
  })

  it('returns zero sum for empty transactions', () => {
    const result = computeTotalCredits(undefined, [])
    expect(result).toEqual({ sum: 0, creditTxnCount: 0, aggregateScope: 'page' })
  })

  it('skips transactions with zero or negative credit', () => {
    const txns = [txn({ amount_credit: '0' }), txn({ amount_credit: '5.00' })]
    const result = computeTotalCredits(undefined, txns)
    expect(result).toEqual({ sum: 5, creditTxnCount: 1, aggregateScope: 'page' })
  })
})

describe('computeTotalDebits', () => {
  it('returns API-level aggregate when sum_amount_debit is present', () => {
    const summary: MemoSummary = { sum_amount_debit: 300, transactions_count: 10 }
    const result = computeTotalDebits(summary, [])
    expect(result).toEqual({ sum: 300, debitTxnCount: null, aggregateScope: 'memo' })
  })

  it('falls back to page-level sum when summary is undefined', () => {
    const txns = [txn({ amount_debit: '40.00' }), txn({ amount_debit: '60.00' })]
    const result = computeTotalDebits(undefined, txns)
    expect(result).toEqual({ sum: 100, debitTxnCount: 2, aggregateScope: 'page' })
  })

  it('returns zero sum for empty transactions', () => {
    const result = computeTotalDebits(undefined, [])
    expect(result).toEqual({ sum: 0, debitTxnCount: 0, aggregateScope: 'page' })
  })

  it('skips transactions with zero debit', () => {
    const txns = [txn({ amount_debit: '0' }), txn({ amount_debit: '12.50' })]
    const result = computeTotalDebits(undefined, txns)
    expect(result).toEqual({ sum: 12.5, debitTxnCount: 1, aggregateScope: 'page' })
  })
})
