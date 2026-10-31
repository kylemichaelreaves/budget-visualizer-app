import { describe, expect, it } from 'vitest'
import { normalizeTransactionTotals } from '@api/transactions/normalizeTransactionTotals'
import { normalizeCategoryTotals } from '@api/transactions/normalizeCategoryTotals'

describe('normalizeTransactionTotals', () => {
  it('reads all four fields as magnitudes', () => {
    expect(
      normalizeTransactionTotals([
        { total_amount_debit: -4210.5, total_amount_credit: 5000, debit_count: 87, credit_count: 3 },
      ]),
    ).toEqual({ debitTotal: 4210.5, creditTotal: 5000, debitCount: 87, creditCount: 3 })
  })

  // pg sends numeric sums and bigint counts as strings unless cast.
  it('accepts numeric strings', () => {
    expect(
      normalizeTransactionTotals([
        { total_amount_debit: '-12.34', total_amount_credit: '5', debit_count: '2', credit_count: '1' },
      ]),
    ).toEqual({ debitTotal: 12.34, creditTotal: 5, debitCount: 2, creditCount: 1 })
  })

  it('treats a null sum as zero: no matching rows', () => {
    expect(
      normalizeTransactionTotals([
        { total_amount_debit: null, total_amount_credit: null, debit_count: 0, credit_count: 0 },
      ]),
    ).toEqual({ debitTotal: 0, creditTotal: 0, debitCount: 0, creditCount: 0 })
  })

  // An older backend returns only the debit sum; the rest must read as unknown, not zero.
  it('leaves fields the server did not send undefined', () => {
    expect(normalizeTransactionTotals([{ total_amount_debit: -100 }])).toEqual({
      debitTotal: 100,
      creditTotal: undefined,
      debitCount: undefined,
      creditCount: undefined,
    })
  })

  it.each([undefined, null, [], [null], 'oops', {}])('returns undefined for %j', (data) => {
    expect(normalizeTransactionTotals(data)).toBeUndefined()
  })
})

describe('normalizeCategoryTotals', () => {
  it('returns magnitudes, largest first, dropping credit-only categories', () => {
    expect(
      normalizeCategoryTotals([
        { budget_category: 'Groceries', total_amount_debit: -120 },
        { budget_category: 'Income', total_amount_debit: 0 },
        { budget_category: 'Rent', total_amount_debit: '-1500' },
        { budget_category: null, total_amount_debit: -5 },
      ]),
    ).toEqual([
      ['Rent', 1500],
      ['Groceries', 120],
      ['Uncategorized', 5],
    ])
  })

  it.each([undefined, null, {}, 'oops'])('returns no categories for %j', (data) => {
    expect(normalizeCategoryTotals(data)).toEqual([])
  })
})
