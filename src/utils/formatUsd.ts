const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

/** USD for transaction tables: empty string when the value is not a finite number. */
export function formatUsd(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num) || value == null || value === '') return ''
  return usd.format(num)
}

/** Memo list and similar: `--` when missing or non-finite. */
export function formatUsdOrDash(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '--'
  return usd.format(value)
}

/** Memo summary cards and signed rows: always a currency string; uses absolute value. */
export function formatUsdAbs(value: number | string | undefined): string {
  const raw = typeof value === 'string' ? Number.parseFloat(value) : value
  if (raw == null || !Number.isFinite(Number(raw))) return usd.format(0)
  return usd.format(Math.abs(Number(raw)))
}

/** Chart axis ticks: compact notation (`$1.2K`, `$3M`). Empty string when not a finite number. */
export function formatUsdCompact(value: number): string {
  return Number.isFinite(value) ? usdCompact.format(value) : ''
}
