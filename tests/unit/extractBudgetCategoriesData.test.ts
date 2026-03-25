import { describe, expect, it } from 'vitest'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'

describe('extractBudgetCategoriesData', () => {
  it('unwraps array wrapper with data', () => {
    const inner = { A: {} }
    expect(extractBudgetCategoriesData([{ data: inner }])).toEqual(inner)
  })

  it('unwraps object with data property', () => {
    const inner = { X: { Y: {} } }
    expect(extractBudgetCategoriesData({ data: inner })).toEqual(inner)
  })

  it('returns raw object when no data wrapper', () => {
    const raw = { Root: {} }
    expect(extractBudgetCategoriesData(raw)).toEqual(raw)
  })

  it('returns null for empty input', () => {
    expect(extractBudgetCategoriesData(null)).toBeNull()
    expect(extractBudgetCategoriesData([])).toBeNull()
  })
})
