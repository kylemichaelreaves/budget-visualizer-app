import { fireEvent, render, screen } from '@solidjs/testing-library'
import type * as d3 from 'd3'
import { createSignal } from 'solid-js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { BudgetCategorySummary } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import BudgetCategoryTreemap from '@components/transactions/charts/BudgetCategoryTreemap'
import type { BudgetCategoryChartHierarchyNode } from '@components/transactions/charts/budgetCategoryChartHierarchy'
import { budgetCategorySummaryStoryData as data } from '@components/transactions/charts/budgetCategorySummaryStoryData'
import { stubResizeObserver } from '../setup/stubResizeObserver'

type Cell = d3.HierarchyRectangularNode<BudgetCategoryChartHierarchyNode>

let restore: () => void
beforeAll(() => {
  restore = stubResizeObserver({ width: 600, height: 400 })
})
afterAll(() => restore())

const root = () => screen.getByTestId('budget-category-treemap')
const svg = () => screen.getByTestId('budget-category-treemap-chart')
const tooltip = () => root().lastElementChild as HTMLElement
const rects = () => [...svg().querySelectorAll<SVGRectElement>('rect')]
const rectFor = (name: string) =>
  rects().find((r) => (r as unknown as { __data__: Cell }).__data__.data.category_name === name)!

function renderTreemap(rows: () => BudgetCategorySummary[], onCellClick = vi.fn()) {
  render(() => (
    <BudgetCategoryTreemap
      data={rows()}
      categoryColors={() => budgetCategoryColorsFromData(rows())}
      onCellClick={onCellClick}
      timeFrame="month"
      date="03-2026"
    />
  ))
  return onCellClick
}

describe('BudgetCategoryTreemap', () => {
  it('lays out a cell per category once it has a size, and labels the period', async () => {
    renderTreemap(() => data)
    await Promise.resolve()
    expect(rectFor('Food')).toBeDefined()
    expect(rectFor('Groceries')).toBeDefined()
    expect(root()).toHaveTextContent('March 2026')
  })

  it('shows the category and amount on hover and hides it on leave', async () => {
    renderTreemap(() => data)
    await Promise.resolve()
    fireEvent.mouseEnter(rectFor('Groceries'))
    expect(tooltip().style.opacity).toBe('1')
    expect(tooltip().querySelector('strong')!.textContent).toBe('Groceries')
    fireEvent.mouseMove(rectFor('Groceries'), { clientX: 20, clientY: 30 })
    expect(tooltip().style.left).not.toBe('')
    fireEvent.mouseLeave(rectFor('Groceries'))
    expect(tooltip().style.opacity).toBe('0')
  })

  it('reports a click on a real category but not on a synthetic "Other" leaf', async () => {
    const onCellClick = renderTreemap(() => data)
    await Promise.resolve()
    fireEvent.click(rectFor('Groceries'))
    expect(onCellClick).toHaveBeenCalledWith(expect.objectContaining({ category_name: 'Groceries' }))
    const other = rects().find((r) =>
      (r as unknown as { __data__: Cell }).__data__.data.category_name.startsWith('Other '),
    )
    if (other) {
      onCellClick.mockClear()
      fireEvent.click(other)
      expect(onCellClick).not.toHaveBeenCalled()
    }
  })

  it('clears the chart when no top-level category has spend', async () => {
    renderTreemap(() =>
      data.map((d) => ({ ...d, total_amount_debit: d.parent_id === null ? 0 : d.total_amount_debit })),
    )
    await Promise.resolve()
    expect(rects()).toHaveLength(0)
  })

  it('hides a visible tooltip when the chart redraws under the cursor', async () => {
    const [rows, setRows] = createSignal<BudgetCategorySummary[]>(data)
    renderTreemap(rows)
    await Promise.resolve()
    fireEvent.mouseEnter(rectFor('Groceries'))
    expect(tooltip().style.opacity).toBe('1')
    setRows(data.slice(0, 4))
    expect(tooltip().style.opacity).toBe('0')
  })
})
