/**
 * Magnitudes from the `totalAmountDebit` aggregate. The credit and count fields
 * are `undefined` when the server did not send them (a backend from before they
 * existed), so callers can tell "not available" from zero.
 */
export type TransactionTotals = {
  debitTotal: number
  creditTotal?: number
  debitCount?: number
  creditCount?: number
}

const finite = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** A null sum means no matching rows: zero, not unknown. */
const sum = (row: Record<string, unknown>, key: string): number | undefined =>
  key in row ? Math.abs(finite(row[key]) ?? 0) : undefined

export function normalizeTransactionTotals(data: unknown): TransactionTotals | undefined {
  const row: unknown = Array.isArray(data) ? data[0] : undefined
  if (row == null || typeof row !== 'object') return undefined
  const r = row as Record<string, unknown>
  return {
    debitTotal: sum(r, 'total_amount_debit') ?? 0,
    creditTotal: sum(r, 'total_amount_credit'),
    debitCount: finite(r.debit_count),
    creditCount: finite(r.credit_count),
  }
}
