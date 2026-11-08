import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createStore } from 'solid-js/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Categories } from '@types'

const [query, setQuery] = createStore<{
  data: Categories | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: null
}>({ data: undefined, isLoading: true, isFetching: true, isError: false, error: null })

vi.mock('@api/hooks/budgetCategories/useBudgetCategories', () => ({ default: () => query }))

const { default: CategoryTreeSelectDialog } =
  await import('@components/transactions/CategoryTreeSelectDialog')

const categories: Categories = { Food: { Groceries: {}, Restaurants: {} }, Rent: {} }

function renderDialog(props: { title?: string; subtitle?: string; onSelect?: (v: string) => void } = {}) {
  return render(() => (
    <CategoryTreeSelectDialog
      open
      onOpenChange={() => {}}
      value=""
      onSelect={props.onSelect ?? (() => {})}
      title={props.title}
      subtitle={props.subtitle}
    />
  ))
}

describe('CategoryTreeSelectDialog', () => {
  beforeEach(() => {
    setQuery({ data: undefined, isLoading: true, isFetching: true })
  })

  it('shows the default title and a loading message', () => {
    renderDialog()
    expect(screen.getByTestId('category-tree-select-dialog-title')).toHaveTextContent(
      'Assign Budget Category',
    )
    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
  })

  it('shows a custom title and subtitle', () => {
    renderDialog({ title: 'Move category', subtitle: 'Coffee shop' })
    expect(screen.getByTestId('category-tree-select-dialog-title')).toHaveTextContent('Move category')
    expect(screen.getByText('Coffee shop')).toBeInTheDocument()
  })

  it('lists the category tree once loaded', () => {
    setQuery({ data: categories, isLoading: false, isFetching: false })
    renderDialog()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Rent')).toBeInTheDocument()
  })

  it('filters by search and reports when nothing matches', () => {
    setQuery({ data: categories, isLoading: false, isFetching: false })
    const onSelect = vi.fn()
    renderDialog({ onSelect })
    const search = screen.getByTestId('category-tree-search')

    fireEvent.input(search, { target: { value: 'groc' } })
    fireEvent.click(screen.getByText('Groceries'))
    expect(onSelect).toHaveBeenCalledWith(expect.stringContaining('Groceries'))

    fireEvent.input(search, { target: { value: 'zzz' } })
    expect(screen.getByText('No categories found')).toBeInTheDocument()
  })
})
