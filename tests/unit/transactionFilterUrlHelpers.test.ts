import { describe, expect, it } from 'vitest'
import {
  applyLegacyMemoParamMigration,
  isBareTransactionsRoute,
  memoIdQueryParamInvalid,
  pathForTransactionFilterSync,
} from '@composables/transactionFilterUrlHelpers'

describe('memoIdQueryParamInvalid', () => {
  it('treats null as valid (absent param)', () => {
    expect(memoIdQueryParamInvalid(null)).toBe(false)
  })
  it('rejects empty string', () => {
    expect(memoIdQueryParamInvalid('')).toBe(true)
  })
  it('rejects non-numeric', () => {
    expect(memoIdQueryParamInvalid('abc')).toBe(true)
  })
  it('rejects zero and negative', () => {
    expect(memoIdQueryParamInvalid('0')).toBe(true)
    expect(memoIdQueryParamInvalid('-1')).toBe(true)
  })
  it('accepts positive integer', () => {
    expect(memoIdQueryParamInvalid('42')).toBe(false)
  })
})

describe('isBareTransactionsRoute', () => {
  it('matches bare transactions path', () => {
    expect(isBareTransactionsRoute('/budget-visualizer/transactions')).toBe(true)
    expect(isBareTransactionsRoute('/budget-visualizer/transactions/')).toBe(true)
  })
  it('rejects edit and summary paths', () => {
    expect(isBareTransactionsRoute('/budget-visualizer/transactions/1/edit')).toBe(false)
    expect(isBareTransactionsRoute('/budget-visualizer/transactions/months/2024-01/summary')).toBe(false)
  })
})

describe('pathForTransactionFilterSync', () => {
  it('rewrites month summary path to transactions list', () => {
    expect(pathForTransactionFilterSync('/budget-visualizer/transactions/months/2024-03/summary')).toBe(
      '/budget-visualizer/transactions',
    )
  })
  it('rewrites week summary path', () => {
    expect(pathForTransactionFilterSync('/budget-visualizer/transactions/weeks/2024-W05/summary')).toBe(
      '/budget-visualizer/transactions',
    )
  })
  it('leaves list path unchanged', () => {
    expect(pathForTransactionFilterSync('/budget-visualizer/transactions')).toBe(
      '/budget-visualizer/transactions',
    )
  })
})

describe('applyLegacyMemoParamMigration', () => {
  it('does nothing when memo param absent', () => {
    const sp = new URLSearchParams('day=2024-01-01')
    applyLegacyMemoParamMigration(sp)
    expect(sp.toString()).toBe('day=2024-01-01')
  })
  it('maps numeric legacy memo to memoId when nothing else set', () => {
    const sp = new URLSearchParams('memo=12')
    applyLegacyMemoParamMigration(sp)
    expect(sp.has('memo')).toBe(false)
    expect(sp.get('memoId')).toBe('12')
  })
  it('maps non-numeric legacy memo to memoName', () => {
    const sp = new URLSearchParams('memo=Groceries')
    applyLegacyMemoParamMigration(sp)
    expect(sp.get('memoName')).toBe('Groceries')
  })
  it('does not set memoId when timeframe already present', () => {
    const sp = new URLSearchParams('memo=12&day=2024-01-01')
    applyLegacyMemoParamMigration(sp)
    expect(sp.get('memoId')).toBe(null)
    expect(sp.get('day')).toBe('2024-01-01')
  })
})
