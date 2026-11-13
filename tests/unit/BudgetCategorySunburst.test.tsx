import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import type { BudgetCategorySummary } from '@types'
import BudgetCategorySunburst from '@components/transactions/charts/BudgetCategorySunburst'
import type { AugmentedNode } from '@components/transactions/charts/mountBudgetCategorySunburst'
import { budgetCategorySummaryStoryData as data } from '@components/transactions/charts/budgetCategorySummaryStoryData'

const svg = () => screen.getByTestId('budget-category-sunburst-chart')
const tooltip = () => svg().parentElement!.parentElement!.lastElementChild as HTMLElement
const arcs = () => [...svg().querySelectorAll<SVGPathElement>('path')]
const arcFor = (name: string) =>
  arcs().find((p) => (p as unknown as { __data__: AugmentedNode }).__data__.data.category_name === name)!

describe('BudgetCategorySunburst', () => {
  it('draws one arc per category below the root', () => {
    render(() => <BudgetCategorySunburst data={data} />)
    // 10 categories plus synthetic "Other" leaves for parents with unallocated spend
    expect(arcs().length).toBeGreaterThanOrEqual(data.length)
    expect(arcFor('Food')).toBeDefined()
  })

  it('shows the category and amount on hover, as text, and hides it on leave', () => {
    render(() => <BudgetCategorySunburst data={data} />)
    fireEvent.mouseEnter(arcFor('Housing'))
    expect(tooltip().style.opacity).toBe('1')
    expect(tooltip().querySelector('strong')!.textContent).toBe('Housing')
    expect(tooltip().textContent).toMatch(/\$/)

    fireEvent.mouseMove(arcFor('Housing'), { clientX: 50, clientY: 50 })
    expect(tooltip().style.left).not.toBe('')

    fireEvent.mouseLeave(arcFor('Housing'))
    expect(tooltip().style.opacity).toBe('0')
  })

  it('zooms into a parent on click, reports it, and shows a breadcrumb back to All', () => {
    const onSliceClick = vi.fn<(row: BudgetCategorySummary) => void>()
    render(() => <BudgetCategorySunburst data={data} onSliceClick={onSliceClick} />)

    fireEvent.click(arcFor('Entertainment'))
    expect(onSliceClick).toHaveBeenCalledWith(expect.objectContaining({ category_name: 'Entertainment' }))
    const crumbs = screen.getByTestId('budget-category-sunburst-breadcrumb')
    expect(crumbs).toHaveTextContent('Entertainment')

    fireEvent.click(arcFor('Subscriptions'))
    expect(crumbs).toHaveTextContent('Subscriptions')
    // An ancestor crumb zooms back out to it.
    fireEvent.click(screen.getByRole('button', { name: 'Entertainment' }))
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.queryByTestId('budget-category-sunburst-breadcrumb')).not.toBeInTheDocument()
  })

  it('draws nothing when no top-level category has spend', () => {
    const empty = data.map((d) => ({
      ...d,
      total_amount_debit: d.parent_id === null ? 0 : d.total_amount_debit,
    }))
    render(() => <BudgetCategorySunburst data={empty} />)
    expect(arcs()).toHaveLength(0)
  })

  it('shows a skeleton while loading', () => {
    render(() => <BudgetCategorySunburst data={data} isLoading />)
    expect(arcs()).toHaveLength(0)
    expect(screen.getByTestId('budget-category-sunburst').querySelector('.rounded-full')).not.toBeNull()
  })

  // A redraw removes the arc under the cursor without a mouseleave, which used
  // to leave the tooltip stuck on screen.
  it('hides the tooltip when the data changes under the cursor', () => {
    const [rows, setRows] = createSignal<BudgetCategorySummary[]>(data)
    render(() => <BudgetCategorySunburst data={rows()} />)
    fireEvent.mouseEnter(arcFor('Housing'))
    expect(tooltip().style.opacity).toBe('1')
    setRows([])
    expect(tooltip().style.opacity).toBe('0')
  })
})
