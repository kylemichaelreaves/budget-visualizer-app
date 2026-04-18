import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCssChartFallbackColor, getCssChartPalette } from '@utils/chartPalette'

function mockComputedStyle(getPropertyValue: (prop: string) => string) {
  return vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue,
      }) as CSSStyleDeclaration,
  )
}

describe('getCssChartPalette', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the D3 fallback palette when document is undefined', () => {
    vi.stubGlobal('document', undefined)
    const palette = getCssChartPalette()
    expect(palette.length).toBeGreaterThanOrEqual(10)
    expect(palette.every((c) => c.length > 0)).toBe(true)
  })

  it('returns trimmed CSS values when --chart-* variables are set', () => {
    mockComputedStyle((prop) => {
      const map: Record<string, string> = {
        '--chart-1': ' oklch(0.5 0 0) ',
        '--chart-2': '#222222',
      }
      return map[prop] ?? ''
    })
    expect(getCssChartPalette()).toEqual(['oklch(0.5 0 0)', '#222222'])
  })

  it('returns the D3 fallback palette when chart variables are empty', () => {
    mockComputedStyle(() => '')
    const palette = getCssChartPalette()
    vi.stubGlobal('document', undefined)
    expect(getCssChartPalette()).toEqual(palette)
  })
})

describe('getCssChartFallbackColor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns neutral hex when document is undefined', () => {
    vi.stubGlobal('document', undefined)
    expect(getCssChartFallbackColor()).toBe('#737373')
  })

  it('returns trimmed --chart-fallback when present', () => {
    mockComputedStyle((prop) => (prop === '--chart-fallback' ? ' #336699 ' : ''))
    expect(getCssChartFallbackColor()).toBe('#336699')
  })

  it('returns neutral hex when --chart-fallback is empty', () => {
    mockComputedStyle(() => '')
    expect(getCssChartFallbackColor()).toBe('#737373')
  })
})
