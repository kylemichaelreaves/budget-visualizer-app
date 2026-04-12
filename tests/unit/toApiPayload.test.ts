import { describe, expect, it } from 'vitest'
import { toApiPayload, memoFieldMapping } from '@api/helpers/toApiPayload'

describe('toApiPayload', () => {
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

  describe('generic mapping', () => {
    it('passes through unmapped keys unchanged', () => {
      const result = toApiPayload({ id: 1, date: '2025-01-01', memo: 'm' }, {})
      expect(result).toEqual({ id: 1, date: '2025-01-01', memo: 'm' })
    })

    it('does not include original keys when mapped', () => {
      const result = toApiPayload({ budget_category: 'Food' }, { budget_category: 'budgetCategory' })
      expect(result).not.toHaveProperty('budget_category')
      expect(result).toHaveProperty('budgetCategory', 'Food')
    })
  })
})
