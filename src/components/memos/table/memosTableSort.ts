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

const categoryColors: Record<string, string> = {}
const palette = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
]

export function getMemosTableCategoryColor(category: string): string {
  if (!categoryColors[category]) {
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = (hash * 31 + category.charCodeAt(i)) | 0
    }
    categoryColors[category] = palette[Math.abs(hash) % palette.length]
  }
  return categoryColors[category]
}

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
