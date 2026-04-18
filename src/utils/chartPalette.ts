import * as d3 from 'd3'

const FALLBACK_PALETTE = [...d3.schemeCategory10, ...(d3.schemeSet2 ?? [])].filter(Boolean) as string[]

/** Reads `--chart-1` … `--chart-5` from the active theme (SSR-safe fallback). */
export function getCssChartPalette(): string[] {
  if (typeof document === 'undefined') return [...FALLBACK_PALETTE]
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const fromCss = [1, 2, 3, 4, 5]
    .map((i) => styles.getPropertyValue(`--chart-${i}`).trim())
    .filter((c) => c.length > 0)
  return fromCss.length ? fromCss : [...FALLBACK_PALETTE]
}

export function getCssChartFallbackColor(): string {
  if (typeof document === 'undefined') return '#737373'
  const v = getComputedStyle(document.documentElement).getPropertyValue('--chart-fallback').trim()
  return v || '#737373'
}
