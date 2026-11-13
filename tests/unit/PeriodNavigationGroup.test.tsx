import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import PeriodNavigationGroup from '@components/transactions/summaries/PeriodNavigationGroup'

describe('PeriodNavigationGroup', () => {
  it('wires prev/next/clear and disables the ends', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const onClear = vi.fn()
    render(() => (
      <PeriodNavigationGroup
        canGoOlder
        canGoNewer={false}
        onPrev={onPrev}
        onNext={onNext}
        onClear={onClear}
      />
    ))
    fireEvent.click(screen.getByTestId('period-header-prev'))
    expect(onPrev).toHaveBeenCalledOnce()
    expect(screen.getByTestId('period-header-next')).toBeDisabled()
    fireEvent.click(screen.getByTestId('period-header-clear'))
    expect(onClear).toHaveBeenCalledOnce()
    // Icons are decorative.
    for (const icon of screen.getByTestId('period-header-prev').querySelectorAll('svg')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
