import * as d3 from 'd3'

const FALLBACK_PALETTE = [...d3.schemeCategory10, ...(d3.schemeSet2 ?? [])].filter(Boolean) as string[]

const D3_SAFE_FALLBACK = '#737373'

/**
 * Paint the color onto a 1×1 canvas and read the sRGB pixel back. Modern Chromium leaves
 * `oklch(...)` / `lab(...)` uncomputed in both `getComputedStyle` and `ctx.fillStyle`, so the only
 * reliable way to force a conversion to a d3-parsable hex is to rasterize.
 */
function hexFromCanvas(cssColor: string): string | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = 'transparent'
  ctx.fillStyle = cssColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Returns a hex color string that D3 can parse (d3-color v3 does not parse `oklch(...)` /
 * `lab(...)` from CSS variables).
 */
export function resolveCssColorForD3(cssColor: string, lastResort: string = D3_SAFE_FALLBACK): string {
  const trimmed = cssColor.trim()
  if (!trimmed) return lastResort

  const direct = d3.color(trimmed)
  if (direct) return direct.formatHex()

  const rasterized = hexFromCanvas(trimmed)
  if (rasterized) return rasterized

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
