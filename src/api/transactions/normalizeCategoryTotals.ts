/** The server already COALESCEs a missing category to this label; mirrored for a row without one. */
const UNCATEGORIZED = 'Uncategorized'

/**
 * `[category, debit magnitude]` pairs from the `budgetCategorySummary` aggregate,
 * largest first. Categories with no debits (credit-only rows sum to 0) are dropped.
 */
export function normalizeCategoryTotals(data: unknown): [string, number][] {
  if (!Array.isArray(data)) return []
  const out: [string, number][] = []
  for (const row of data) {
    if (row == null || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const total = Math.abs(Number(r.total_amount_debit))
    if (!Number.isFinite(total) || total === 0) continue
    const name =
      typeof r.budget_category === 'string' && r.budget_category ? r.budget_category : UNCATEGORIZED
    out.push([name, total])
  }
  return out.sort((a, b) => b[1] - a[1])
}
