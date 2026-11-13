import { describe, expect, it } from 'vitest'
import type { PendingTransaction, Transaction } from '@types'
import { parsePendingTransactionData } from '@components/transactions/helpers/parsePendingTransactionData'
import { parseRow } from '@components/transactions/pending/pendingTransactionsTableUtils'

const txn = {
  id: 9,
  date: '2026-03-01',
  description: 'Coffee',
  memo: 'Cafe',
  amount_debit: '-4.50',
} as Transaction
const pending = (transaction_data: string | Transaction, extra: Partial<PendingTransaction> = {}) =>
  ({ id: 3, transaction_data, status: 'pending', ...extra }) as PendingTransaction

describe('parsePendingTransactionData', () => {
  it('passes a parsed JSONB object through', () => {
    expect(parsePendingTransactionData(pending(txn))).toBe(txn)
  })

  it('parses a JSON string', () => {
    expect(parsePendingTransactionData(pending(JSON.stringify(txn)))).toEqual(txn)
  })

  it('returns null for invalid JSON', () => {
    expect(parsePendingTransactionData(pending('{nope'))).toBeNull()
  })
})

describe('parseRow', () => {
  it('builds a form row keyed by the pending id, preferring the assigned category', () => {
    const row = parseRow(
      pending(JSON.stringify({ ...txn, budget_category: 'Food' }), { assigned_category: 'Dining' }),
    )
    expect(row).toMatchObject({
      id: 3,
      description: 'Coffee',
      amount_debit: '-4.50',
      budget_category: 'Dining',
    })
  })

  it('falls back to placeholders when the data is unreadable', () => {
    expect(parseRow(pending('{nope'))).toMatchObject({
      id: 3,
      transaction_number: 'PENDING-3',
      description: '',
      amount_debit: '0.00',
    })
  })
})
