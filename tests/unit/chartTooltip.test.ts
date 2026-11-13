import { describe, expect, it } from 'vitest'
import {
  hideChartTooltip,
  moveChartTooltipToPointer,
  setChartTooltipContent,
  showChartTooltipAt,
} from '@charts/chartTooltip'

const rectAt = (left: number, top: number) => () => ({ left, top, width: 0, height: 0 }) as DOMRect

describe('chartTooltip', () => {
  it('writes a bold title and a detail line as text, never markup', () => {
    const el = document.createElement('div')
    setChartTooltipContent(el, '<img src=x onerror=alert(1)>', '$5.00')
    expect([...el.children].map((c) => c.tagName)).toEqual(['STRONG', 'BR'])
    expect(el.querySelector('strong')!.textContent).toBe('<img src=x onerror=alert(1)>')
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>$5.00')
  })

  it('replaces previous content', () => {
    const el = document.createElement('div')
    setChartTooltipContent(el, 'A', '1')
    setChartTooltipContent(el, 'B', '2')
    expect(el.textContent).toBe('B2')
  })

  it('shows at a position and hides', () => {
    const el = document.createElement('div')
    showChartTooltipAt(el, 10, 20)
    expect([el.style.left, el.style.top, el.style.opacity]).toEqual(['10px', '20px', '1'])
    hideChartTooltip(el)
    expect(el.style.opacity).toBe('0')
    expect(() => hideChartTooltip(undefined)).not.toThrow()
  })

  it('follows the pointer relative to the fallback anchor when there is no offset parent', () => {
    // jsdom never sets offsetParent, which is exactly the fallback case.
    const el = document.createElement('div')
    const anchor = document.createElement('div')
    anchor.getBoundingClientRect = rectAt(100, 50)
    moveChartTooltipToPointer(el, new MouseEvent('mousemove', { clientX: 130, clientY: 90 }), anchor)
    expect([el.style.left, el.style.top, el.style.opacity]).toEqual(['42px', '28px', '1'])
  })

  it('does nothing without any anchor', () => {
    const el = document.createElement('div')
    moveChartTooltipToPointer(el, new MouseEvent('mousemove', { clientX: 1, clientY: 1 }))
    expect(el.style.opacity).toBe('')
  })
})
