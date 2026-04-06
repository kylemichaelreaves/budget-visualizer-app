import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import CategoryBadge from '@components/shared/CategoryBadge'

describe('CategoryBadge', () => {
  it('renders category text as content', () => {
    const getColorByName = vi.fn().mockReturnValue('#999999')
    render(() => <CategoryBadge category="Groceries" getColorByName={getColorByName} />)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('extracts leaf name from path for color lookup', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => <CategoryBadge category="Food - Groceries" getColorByName={getColorByName} />)
    expect(getColorByName).toHaveBeenCalledWith('Groceries')
  })

  it('uses full name for single-segment category', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => <CategoryBadge category="Groceries" getColorByName={getColorByName} />)
    expect(getColorByName).toHaveBeenCalledWith('Groceries')
  })

  it('extracts leaf from deeply nested path', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => (
      <CategoryBadge category="Entertainment - Subscriptions - Streaming" getColorByName={getColorByName} />
    ))
    expect(getColorByName).toHaveBeenCalledWith('Streaming')
  })

  it('applies color to border-color and color styles', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => (
      <CategoryBadge category="Groceries" getColorByName={getColorByName} dataTestId="test-badge" />
    ))
    const badge = screen.getByTestId('test-badge')
    // jsdom normalizes hex to rgb
    expect(badge.style.borderColor).toBe('rgb(31, 119, 180)')
    expect(badge.style.color).toBe('rgb(31, 119, 180)')
  })

  it('applies tinted background when color is not fallback', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => (
      <CategoryBadge category="Groceries" getColorByName={getColorByName} dataTestId="test-badge" />
    ))
    const badge = screen.getByTestId('test-badge')
    // #1f77b415 is ~8% alpha, jsdom normalizes to rgba
    expect(badge.style.backgroundColor).toBeTruthy()
    expect(badge.style.backgroundColor).toContain('31, 119, 180')
  })

  it('does not apply background when color is fallback #999999', () => {
    const getColorByName = vi.fn().mockReturnValue('#999999')
    render(() => <CategoryBadge category="Unknown" getColorByName={getColorByName} dataTestId="test-badge" />)
    const badge = screen.getByTestId('test-badge')
    expect(badge.style.backgroundColor).toBe('')
  })

  it('renders children instead of category text when provided', () => {
    const getColorByName = vi.fn().mockReturnValue('#1f77b4')
    render(() => (
      <CategoryBadge category="Groceries" getColorByName={getColorByName}>
        <span data-testid="custom-child">Custom Content</span>
      </CategoryBadge>
    ))
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('renders data-testid when provided', () => {
    const getColorByName = vi.fn().mockReturnValue('#999999')
    render(() => <CategoryBadge category="Test" getColorByName={getColorByName} dataTestId="my-badge" />)
    expect(screen.getByTestId('my-badge')).toBeInTheDocument()
  })
})
