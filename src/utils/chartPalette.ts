import * as d3 from 'd3'

const FALLBACK_PALETTE = [...d3.schemeCategory10, ...(d3.schemeSet2 ?? [])].filter(Boolean) as string[]

const D3_SAFE_FALLBACK = '#737373'

/**
 * Returns a hex color string that D3 can parse (D3 v7 does not parse `oklch(...)` from CSS variables).
 * In a real browser, `oklch` / `lab` values are resolved via computed style on a probe element.
 */
export function resolveCssColorForD3(cssColor: string, lastResort: string = D3_SAFE_FALLBACK): string {
  const trimmed = cssColor.trim()
  if (!trimmed) return lastResort

  const direct = d3.color(trimmed)
  if (direct) return direct.formatHex()

  if (typeof document === 'undefined') return lastResort

  const probe = document.createElement('span')
  probe.setAttribute('data-d3-color-probe', 'true')
  probe.style.color = ''
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.left = '-9999px'
  probe.style.top = '0'
  probe.style.color = trimmed

  const host = document.body ?? document.documentElement
  host.appendChild(probe)
  const resolved = getComputedStyle(probe).color.trim()
  host.removeChild(probe)

  if (resolved && resolved !== 'rgba(0, 0, 0, 0)' && resolved !== 'transparent') {
    const parsed = d3.color(resolved)
    if (parsed) return parsed.formatHex()
  }

  return lastResort
}

/** Reads `--chart-1` … `--chart-5` from the active theme (SSR-safe fallback). */
export function getCssChartPalette(): string[] {
  if (typeof document === 'undefined') return [...FALLBACK_PALETTE]
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const fromCss = [1, 2, 3, 4, 5]
    .map((i) => styles.getPropertyValue(`--chart-${i}`).trim())
    .filter((c) => c.length > 0)
  return fromCss.length ? fromCss.map((c) => resolveCssColorForD3(c)) : [...FALLBACK_PALETTE]
}

export function getCssChartFallbackColor(): string {
  if (typeof document === 'undefined') return D3_SAFE_FALLBACK
  const v = getComputedStyle(document.documentElement).getPropertyValue('--chart-fallback').trim()
  return resolveCssColorForD3(v || D3_SAFE_FALLBACK)
}
