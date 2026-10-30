import { expect } from 'vitest'

/**
 * Asserts rendered markup takes every colour from a design token: no inline style, hex / rgb /
 * oklch literal, Tailwind arbitrary value (`bg-[var(--x)]`, `bg-[#fff]`) or raw palette class (`text-red-500`).
 */
export function expectNoLiteralColours(html: string): void {
  expect(html).not.toMatch(/style=/)
  expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  expect(html).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/i)
  // Arbitrary values, except plain lengths such as the Button primitive's `ring-[3px]`.
  expect(html).not.toMatch(/\b(?:text|bg|border|fill|stroke|ring)-\[(?![\d.]+(?:px|rem|em)?\])/)
  expect(html).not.toMatch(
    /\b(?:text|bg|border|fill|stroke|ring)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)\b/,
  )
}
