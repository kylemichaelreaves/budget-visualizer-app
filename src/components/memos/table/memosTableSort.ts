import type { Memo } from '@types'

export type MemosTableSortKey =
  | 'name'
  | 'transactions_count'
  | 'ambiguous'
  | 'budget_category'
  | 'total_amount_debit'

export type MemosTableSortDir = 'asc' | 'desc'

export const MEMOS_TABLE_SORTABLE_COLUMNS: { key: MemosTableSortKey; label: string }[] = [
  { key: 'name', label: 'Memo' },
  { key: 'transactions_count', label: 'Transactions' },
  { key: 'ambiguous', label: 'Ambiguous' },
  { key: 'budget_category', label: 'Budget Category' },
  { key: 'total_amount_debit', label: 'Total Debit' },
]

export function compareMemos(a: Memo, b: Memo, key: MemosTableSortKey, dir: MemosTableSortDir): number {
  const av = a[key]
  const bv = b[key]

  let result: number
  if (av == null && bv == null) result = 0
  else if (av == null) result = 1
  else if (bv == null) result = -1
  else if (typeof av === 'string' && typeof bv === 'string') result = av.localeCompare(bv)
  else if (typeof av === 'boolean' && typeof bv === 'boolean') result = Number(av) - Number(bv)
  else if (typeof av === 'number' && typeof bv === 'number') result = av - bv
  else result = String(av).localeCompare(String(bv))

  return dir === 'desc' ? -result : result
}
