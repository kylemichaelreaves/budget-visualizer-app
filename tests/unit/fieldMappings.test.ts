import { describe, expect, it } from 'vitest'
import {
  FIELD_PAIRS,
  snakeToCamelMap,
  camelToSnakeMap,
  mapSnakeToCamel,
  mapCamelToSnake,
} from '@api/helpers/fieldMappings'

describe('fieldMappings', () => {
  describe('FIELD_PAIRS', () => {
    it('contains no duplicate snake_case keys', () => {
      const snakeKeys = FIELD_PAIRS.map(([s]) => s)
      expect(new Set(snakeKeys).size).toBe(snakeKeys.length)
    })

    it('contains no duplicate camelCase keys', () => {
      const camelKeys = FIELD_PAIRS.map(([, c]) => c)
      expect(new Set(camelKeys).size).toBe(camelKeys.length)
    })
  })

  describe('snakeToCamelMap / camelToSnakeMap', () => {
    it('are inverses of each other', () => {
      for (const [snake, camel] of FIELD_PAIRS) {
        expect(snakeToCamelMap.get(snake)).toBe(camel)
        expect(camelToSnakeMap.get(camel)).toBe(snake)
      }
    })
  })

  describe('mapSnakeToCamel', () => {
    it('maps known snake_case keys to camelCase', () => {
      expect(mapSnakeToCamel({ budget_category: 'Food', amount_debit: -50 })).toEqual({
        budgetCategory: 'Food',
        amountDebit: -50,
      })
    })

    it('passes through unmapped keys', () => {
      expect(mapSnakeToCamel({ id: 1, date: '2025-01-01', memo: 'm' })).toEqual({
        id: 1,
        date: '2025-01-01',
        memo: 'm',
      })
    })
  })

  describe('mapCamelToSnake', () => {
    it('maps known camelCase keys to snake_case', () => {
      expect(mapCamelToSnake({ budgetCategory: 'Food', amountDebit: -50 })).toEqual({
        budget_category: 'Food',
        amount_debit: -50,
      })
    })

    it('passes through unmapped keys', () => {
      expect(mapCamelToSnake({ id: 1, date: '2025-01-01', memo: 'm' })).toEqual({
        id: 1,
        date: '2025-01-01',
        memo: 'm',
      })
    })
  })

  describe('round-trip', () => {
    it('snake → camel → snake preserves all keys', () => {
      const original = {
        id: 1,
        budget_category: 'Food - Groceries',
        amount_debit: '-37.31',
        is_split: false,
        memo_id: 10,
        date: '2025-01-15',
      }
      expect(mapCamelToSnake(mapSnakeToCamel(original))).toEqual(original)
    })
  })
})
