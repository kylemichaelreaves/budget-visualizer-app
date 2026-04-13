import { describe, expect, it } from 'vitest'
import type { BudgetCategoryState, Transaction } from '@types'
import {
  getBudgetCategory,
  initBudgetState,
  mutationAlertFromError,
} from '@components/transactions/forms/transactionEditFormUtils'

const baseTxn: Transaction = {
  id: 1,
  transaction_number: 'TXN-001',
  date: '2026-01-15',
  amount_debit: '50.00',
  amount_credit: '',
  description: 'Grocery Store',
  memo: 'Weekly groceries',
  memo_id: null,
  budget_category: 'Food',
  balance: '1000.00',
  check_number: null,
  fees: null,
  is_split: false,
}

describe('initBudgetState', () => {
  it('returns single mode with categoryId for a string budget_category', () => {
    const result = initBudgetState(baseTxn)
    expect(result).toEqual({ mode: 'single', categoryId: 'Food' })
  })

  it('returns single mode with null categoryId when budget_category is not a string', () => {
    const txn = { ...baseTxn, budget_category: null } as unknown as Transaction
    const result = initBudgetState(txn)
    expect(result).toEqual({ mode: 'single', categoryId: null })
  })

  it('returns split mode with mapped splits for a split transaction', () => {
    const splits = [
      { budget_category_id: 'cat-1', amount_debit: '30.00' },
      { budget_category_id: 'cat-2', amount_debit: '20.00' },
    ]
    const txn = { ...baseTxn, is_split: true, budget_category: splits } as unknown as Transaction
    const result = initBudgetState(txn)
    expect(result.mode).toBe('split')
    if (result.mode !== 'split') throw new Error('expected split mode')
    expect(result.splits).toHaveLength(2)
    expect(result.splits[0].budget_category_id).toBe('cat-1')
    expect(result.splits[0].amount_debit).toBe('30.00')
    expect(result.splits[1].budget_category_id).toBe('cat-2')
    expect(result.splits[1].amount_debit).toBe('20.00')
    expect(result.splits[0].id).toMatch(/^split_0_/)
    expect(result.splits[1].id).toMatch(/^split_1_/)
  })
})

describe('getBudgetCategory', () => {
  it('returns categoryId in single mode', () => {
    const state: BudgetCategoryState = { mode: 'single', categoryId: 'Food' }
    expect(getBudgetCategory(state)).toBe('Food')
  })

  it('returns null in single mode when categoryId is null', () => {
    const state: BudgetCategoryState = { mode: 'single', categoryId: null }
    expect(getBudgetCategory(state)).toBeNull()
  })

  it('returns splits array in split mode', () => {
    const splits = [{ id: '1', budget_category_id: 'cat-1', amount_debit: '50.00' }]
    const state: BudgetCategoryState = { mode: 'split', splits }
    expect(getBudgetCategory(state)).toBe(splits)
  })
})

describe('mutationAlertFromError', () => {
  it('extracts name and message from an Error instance', () => {
    const err = new TypeError('Invalid input')
    const result = mutationAlertFromError(err)
    expect(result).toEqual({ title: 'TypeError', message: 'Invalid input' })
  })

  it('falls back to default title for Error with empty name', () => {
    const err = new Error('Something went wrong')
    err.name = ''
    expect(mutationAlertFromError(err)).toEqual({
      title: 'Error',
      message: 'Something went wrong',
    })
  })

  it('extracts message from a plain object with message property', () => {
    const err = { message: 'Server error' }
    expect(mutationAlertFromError(err)).toEqual({ title: 'Error', message: 'Server error' })
  })

  it('uses String coercion for non-object, non-Error values', () => {
    expect(mutationAlertFromError('raw string')).toEqual({ title: 'Error', message: 'raw string' })
  })

  it('returns default message for null', () => {
    expect(mutationAlertFromError(null)).toEqual({
      title: 'Error',
      message: 'Failed to save transaction',
    })
  })

  it('returns default message for undefined', () => {
    expect(mutationAlertFromError(undefined)).toEqual({
      title: 'Error',
      message: 'Failed to save transaction',
    })
  })
})
