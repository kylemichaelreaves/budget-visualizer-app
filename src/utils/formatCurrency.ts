const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return formatter.format(num)
}
