import { describe, expect, it } from 'vitest'
import { toApiPayload, transactionFieldMapping, memoFieldMapping } from '@api/helpers/toApiPayload'

describe('toApiPayload', () => {
  describe('with transactionFieldMapping', () => {
    const convert = (data: Record<string, unknown>) => toApiPayload(data, transactionFieldMapping)

    it('maps transaction_number to transactionNumber', () => {
      expect(convert({ transaction_number: '12345' })).toHaveProperty('transactionNumber', '12345')
    })

    it('maps amount_debit to amountDebit', () => {
      expect(convert({ amount_debit: -50.0 })).toHaveProperty('amountDebit', -50.0)
    })

    it('maps amount_credit to amountCredit', () => {
      expect(convert({ amount_credit: 100 })).toHaveProperty('amountCredit', 100)
    })

    it('maps check_number to checkNumber', () => {
      expect(convert({ check_number: '999' })).toHaveProperty('checkNumber', '999')
    })

    it('maps memo_id to memoId', () => {
      expect(convert({ memo_id: 42 })).toHaveProperty('memoId', 42)
    })

    it('maps budget_category to budgetCategory', () => {
      expect(convert({ budget_category: 'Food - Groceries' })).toHaveProperty(
        'budgetCategory',
        'Food - Groceries',
      )
    })

    it('maps is_split to isSplit', () => {
      expect(convert({ is_split: false })).toHaveProperty('isSplit', false)
    })

    it('passes through unmapped keys unchanged', () => {
      const result = convert({ id: 1, date: '2025-01-01', description: 'test', memo: 'm', balance: 100, fees: null })
      expect(result).toEqual({ id: 1, date: '2025-01-01', description: 'test', memo: 'm', balance: 100, fees: null })
    })

    it('handles a full transaction with mixed mapped and unmapped keys', () => {
      const input = {
        id: 1,
        transaction_number: '123',
        date: '2025-01-01',
        description: 'POS PURCHASE',
        memo: 'STORE',
        amount_debit: -25.5,
        amount_credit: null,
        balance: 1000,
        check_number: null,
        fees: null,
        memo_id: 10,
        budget_category: 'Food - Restaurants',
        is_split: false,
      }
      const result = convert(input)
      expect(result).toEqual({
        id: 1,
        transactionNumber: '123',
        date: '2025-01-01',
        description: 'POS PURCHASE',
        memo: 'STORE',
        amountDebit: -25.5,
        amountCredit: null,
        balance: 1000,
        checkNumber: null,
        fees: null,
        memoId: 10,
        budgetCategory: 'Food - Restaurants',
        isSplit: false,
      })
    })

    it('does not include original snake_case keys in output', () => {
      const result = convert({ budget_category: 'Food', amount_debit: -10 })
      expect(result).not.toHaveProperty('budget_category')
      expect(result).not.toHaveProperty('amount_debit')
    })
  })

  describe('with memoFieldMapping', () => {
    const convert = (data: Record<string, unknown>) => toApiPayload(data, memoFieldMapping)

    it('maps budget_category to budgetCategory', () => {
      expect(convert({ budget_category: 'Entertainment' })).toHaveProperty('budgetCategory', 'Entertainment')
    })

    it('passes through id, name, recurring, necessary, ambiguous unchanged', () => {
      const input = { id: 5, name: 'Test Memo', recurring: true, necessary: false, ambiguous: false }
      expect(convert(input)).toEqual(input)
    })

    it('handles memo with budget_category alongside other fields', () => {
      const input = { id: 1, name: 'STORE', budget_category: 'Food - Groceries' }
      const result = convert(input)
      expect(result).toEqual({ id: 1, name: 'STORE', budgetCategory: 'Food - Groceries' })
    })
  })
})
