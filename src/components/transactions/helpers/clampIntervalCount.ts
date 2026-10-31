export const MIN_INTERVAL_COUNT = 1
export const MAX_INTERVAL_COUNT = 100

/** Whole number in [MIN_INTERVAL_COUNT, MAX_INTERVAL_COUNT]; unparseable input falls back to the minimum. */
export function clampIntervalCount(raw: string | number): number {
  const n = Math.trunc(Number(raw))
  if (!Number.isFinite(n) || n < MIN_INTERVAL_COUNT) return MIN_INTERVAL_COUNT
  return Math.min(n, MAX_INTERVAL_COUNT)
}
