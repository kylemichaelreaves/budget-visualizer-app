import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import SignedUsdAmount, { signedUsdToneClass } from '@components/shared/SignedUsdAmount'

describe('signedUsdToneClass', () => {
  it('returns red tone for debit', () => {
    expect(signedUsdToneClass('debit')).toContain('text-red-600')
  })

  it('returns green tone for credit', () => {
    expect(signedUsdToneClass('credit')).toContain('text-green-600')
  })

  it('includes tabular-nums and font-semibold for both variants', () => {
    for (const v of ['debit', 'credit'] as const) {
      const cls = signedUsdToneClass(v)
      expect(cls).toContain('tabular-nums')
      expect(cls).toContain('font-semibold')
    }
  })
})

describe('SignedUsdAmount', () => {
  it('renders debit with minus sign and absolute formatting', () => {
    render(() => <SignedUsdAmount variant="debit" value={1234.5} />)
    expect(screen.getByText(/-\$1,234\.50/)).toBeInTheDocument()
  })

  it('renders credit with plus sign and absolute formatting', () => {
    render(() => <SignedUsdAmount variant="credit" value={500} />)
    expect(screen.getByText(/\+\$500\.00/)).toBeInTheDocument()
  })

  it('uses absolute value even when given a negative number', () => {
    render(() => <SignedUsdAmount variant="debit" value={-42} />)
    expect(screen.getByText(/-\$42\.00/)).toBeInTheDocument()
  })

  it('merges caller class with tone class', () => {
    const { container } = render(() => (
      <SignedUsdAmount variant="credit" value={10} class="ml-2 whitespace-nowrap" />
    ))
    const span = container.querySelector('span')!
    expect(span.className).toContain('text-green-600')
    expect(span.className).toContain('ml-2')
    expect(span.className).toContain('whitespace-nowrap')
  })
})
