import { render } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import EquationComponent from '@components/shared/EquationComponent'

describe('EquationComponent', () => {
  it('renders a katex equation into the DOM', () => {
    const { container } = render(() => <EquationComponent equation="x^2 + y^2 = z^2" />)
    const katexEl = container.querySelector('.katex')
    expect(katexEl).not.toBeNull()
  })

  it('renders different equations', () => {
    const { container } = render(() => <EquationComponent equation="E = mc^2" />)
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.textContent).toContain('E')
  })

  it('handles invalid latex gracefully (throwOnError: false)', () => {
    const { container } = render(() => <EquationComponent equation="\invalid{" />)
    // Should not throw, renders error span or partial output
    expect(container.firstChild).not.toBeNull()
  })
})
