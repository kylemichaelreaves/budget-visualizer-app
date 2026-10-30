/** Amounts arrive as strings ('0', '0.00'), so truthiness can't tell an empty amount from a real one. */
export function isNonZeroAmount(value: string | number | null | undefined): boolean {
  const n = Number(value)
  return Number.isFinite(n) && n !== 0
}
