import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createStore } from 'solid-js/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Categories } from '@types'

// #80: while categories load, the selected value is a synthetic "(current)" option.
// When the real options arrive, <For> removes that <option>, and the `value` binding
// doesn't re-run because props.value hasn't changed — so the browser falls back to
// another option and the select shows a category the parent doesn't hold.

const [query, setQuery] = createStore<{
  data: Categories | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: null
}>({ data: undefined, isLoading: true, isFetching: true, isError: false, error: null })

vi.mock('@api/hooks/budgetCategories/useBudgetCategories', () => ({ default: () => query }))

const { default: BudgetCategoriesTreeSelect } =
  await import('@components/transactions/selects/BudgetCategoriesTreeSelect')

const categories: Categories = { Food: { Groceries: {}, Restaurants: {} }, Rent: {} }

function loadCategories() {
  setQuery({ data: categories, isLoading: false, isFetching: false })
}

function select() {
  return screen.getByTestId('budget-category-tree-select') as HTMLSelectElement
}

describe('BudgetCategoriesTreeSelect', () => {
  beforeEach(() => {
    setQuery({ data: undefined, isLoading: true, isFetching: true })
  })

  it('keeps showing the selected category once options load', () => {
    render(() => (
      <BudgetCategoriesTreeSelect value="Food - Groceries" onChange={() => {}} clearable={false} />
    ))
    expect(select().value).toBe('Food - Groceries')

    loadCategories()
    expect(select().value).toBe('Food - Groceries')
  })

  it('keeps showing the selected category once options load when clearable', () => {
    render(() => <BudgetCategoriesTreeSelect value="Food - Groceries" onChange={() => {}} />)
    loadCategories()
    expect(select().value).toBe('Food - Groceries')
  })

  it('keeps showing the selected category when the filter excludes it', () => {
    loadCategories()
    render(() => <BudgetCategoriesTreeSelect value="Food - Groceries" onChange={() => {}} filterable />)
    expect(select().value).toBe('Food - Groceries')

    fireEvent.input(screen.getByTestId('budget-category-tree-select-filter'), { target: { value: 'Ren' } })
    expect(select().value).toBe('Food - Groceries')
  })

  it('shows the placeholder when there is no value', () => {
    render(() => <BudgetCategoriesTreeSelect value={null} onChange={() => {}} />)
    loadCategories()
    expect(select().value).toBe('')
  })
})
