const DASH = '—'

/** Missing CloudWatch data is null and renders as a dash, never as 0. */
export function formatCount(n: number | null): string {
  return n === null ? DASH : n.toLocaleString('en-US')
}

export function formatMs(ms: number | null): string {
  if (ms === null) return DASH
  if (Math.round(ms) < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function formatPercent(p: number | null): string {
  return p === null ? DASH : `${Math.round(p)}%`
}

export function formatRate(numerator: number | null, denominator: number | null): string {
  if (numerator === null || denominator === null || denominator === 0) return DASH
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}
