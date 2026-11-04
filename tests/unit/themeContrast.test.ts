import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(__dirname, '../../src/styles/theme.css'), 'utf8')

function darkToken(name: string): string {
  const block = /\.dark\s*\{([^}]*)\}/.exec(css)
  if (!block) throw new Error('.dark block not found in theme.css')
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(block[1])
  if (!match) throw new Error(`${name} not found in .dark block`)
  return match[1].trim()
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

/** Relative luminance. Supports #rrggbb and achromatic oklch(L 0 0) only. */
function luminance(value: string): number {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(hex[1].slice(i, i + 2), 16) / 255))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const oklch = /^oklch\(\s*([\d.]+)\s+0\s+0\s*\)$/.exec(value)
  if (oklch) return Number(oklch[1]) ** 3 // chroma 0: linear channel = L^3
  throw new Error(`Unsupported color format: ${value}`)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('dark theme contrast', () => {
  it('brand-foreground on brand meets WCAG AA (4.5:1)', () => {
    const ratio = contrast(darkToken('--brand'), darkToken('--brand-foreground'))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})
