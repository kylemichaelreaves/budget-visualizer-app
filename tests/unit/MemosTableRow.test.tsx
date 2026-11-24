import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'
import MemosTableRow from '@components/memos/table/MemosTableRow'

const memo = (over: Partial<Memo> = {}) =>
  ({ id: 7, name: 'Gym', ambiguous: false, budget_category: null, transactions_count: 3, ...over }) as Memo

function renderRow(row: Memo, opts: { toggling?: number | null; mutating?: number | null } = {}) {
  const onToggleAmbiguous = vi.fn()
  const onAssignCategory = vi.fn()
  render(() => (
    <table>
      <tbody>
        <MemosTableRow
          row={row}
          togglingAmbiguousId={() => opts.toggling ?? null}
          mutatingCategoryId={() => opts.mutating ?? null}
          onToggleAmbiguous={onToggleAmbiguous}
          onAssignCategory={onAssignCategory}
          getColorByName={() => '#000'}
        />
      </tbody>
    </table>
  ))
  return { onToggleAmbiguous, onAssignCategory }
}

describe('MemosTableRow', () => {
  // Solid 2 drops a boolean aria value instead of writing "false", so the row
  // spells out both states for assistive tech.
  it.each([
    [false, 'false', 'No'],
    [true, 'true', 'Yes'],
  ])('reports ambiguous=%s as aria-pressed=%s', (ambiguous, pressed, text) => {
    const { onToggleAmbiguous } = renderRow(memo({ ambiguous }))
    const toggle = screen.getByTestId('ambiguous-toggle-7')
    expect(toggle).toHaveAttribute('aria-pressed', pressed)
    expect(toggle).toHaveTextContent(text)
    fireEvent.click(toggle)
    expect(onToggleAmbiguous).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
  })

  it('disables the toggle while it is saving', () => {
    renderRow(memo(), { toggling: 7 })
    expect(screen.getByTestId('ambiguous-toggle-7')).toBeDisabled()
  })

  it('offers to assign a category', () => {
    const { onAssignCategory } = renderRow(memo())
    fireEvent.click(screen.getByTestId('assign-category-7'))
    expect(onAssignCategory).toHaveBeenCalled()
  })

  it('shows a skeleton instead of the category while it saves', () => {
    renderRow(memo({ budget_category: 'Health' }), { mutating: 7 })
    expect(screen.queryByTestId('category-badge-7')).not.toBeInTheDocument()
  })
})
