import { describe, expect, it } from 'vitest'
import type { Memo, RecurringCadence } from '@types'
import {
  MEMO_EDIT_FREQUENCY_OPTIONS,
  buildMemoUpdateInput,
  memoToFormState,
  type MemoEditFormState,
} from '@components/memos/forms/memoEditFormUtils'

const baseMemo: Memo = {
  id: 12,
  name: 'Coffee shops',
  recurring: true,
  necessary: false,
  ambiguous: true,
  frequency: 'monthly',
  budget_category: 'Food - Dining',
}

describe('memoToFormState', () => {
  it('maps memo fields into form state', () => {
    expect(memoToFormState(baseMemo)).toEqual({
      id: 12,
      name: 'Coffee shops',
      necessary: false,
      ambiguous: true,
      frequency: 'monthly',
      budget_category: 'Food - Dining',
    })
  })

  it('does not carry recurring, which the frequency already determines', () => {
    expect(memoToFormState(baseMemo)).not.toHaveProperty('recurring')
  })

  it('uses empty frequency and null budget category when memo omits them', () => {
    const memo: Memo = {
      ...baseMemo,
      frequency: undefined,
      budget_category: undefined,
    }
    expect(memoToFormState(memo)).toMatchObject({
      frequency: '',
      budget_category: null,
    })
  })

  it('preserves null budget_category from memo', () => {
    const memo: Memo = { ...baseMemo, budget_category: null }
    expect(memoToFormState(memo).budget_category).toBeNull()
  })
})

describe('buildMemoUpdateInput', () => {
  const form: MemoEditFormState = {
    id: 12,
    name: 'Coffee shops',
    necessary: true,
    ambiguous: false,
    frequency: 'weekly',
    budget_category: 'Transport',
  }

  it('builds camelCase update payload from form and trimmed name', () => {
    expect(buildMemoUpdateInput(form, 'Coffee shops')).toEqual({
      id: 12,
      name: 'Coffee shops',
      recurring: true,
      necessary: true,
      ambiguous: false,
      frequency: 'weekly',
      budgetCategory: 'Transport',
    })
  })

  it('marks a memo recurring whenever a frequency is selected', () => {
    expect(buildMemoUpdateInput(form, 'Name')).toMatchObject({
      recurring: true,
      frequency: 'weekly',
    })
  })

  it('clears recurring alongside frequency when the blank option is selected', () => {
    const emptyFreq: MemoEditFormState = { ...form, frequency: '' }
    expect(buildMemoUpdateInput(emptyFreq, 'Name')).toEqual({
      id: 12,
      name: 'Name',
      recurring: false,
      necessary: true,
      ambiguous: false,
      frequency: null,
      budgetCategory: 'Transport',
    })
  })
})

describe('MEMO_EDIT_FREQUENCY_OPTIONS', () => {
  it('includes a blank option and all frequency values', () => {
    expect(MEMO_EDIT_FREQUENCY_OPTIONS[0]?.value).toBe('')
    const values = MEMO_EDIT_FREQUENCY_OPTIONS.map((o) => o.value).filter(Boolean)
    expect(values).toEqual(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  })

  it('offers biweekly and quarterly, so every cadence the recurring detector emits has a memo value', () => {
    const byValue = new Map(MEMO_EDIT_FREQUENCY_OPTIONS.map((o) => [o.value, o.label]))
    expect(byValue.get('biweekly')).toBe('Biweekly')
    expect(byValue.get('quarterly')).toBe('Quarterly')
    for (const cadence of [
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'yearly',
    ] satisfies RecurringCadence[]) {
      expect(byValue.has(cadence)).toBe(true)
    }
  })

  it('labels the blank option as the way to stop a memo recurring', () => {
    expect(MEMO_EDIT_FREQUENCY_OPTIONS[0]?.label).toBe('Not recurring')
  })
})
