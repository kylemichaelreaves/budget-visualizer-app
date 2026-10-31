import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import type { TransactionTotals } from '@api/transactions/normalizeTransactionTotals'
import { transactionsState } from '@stores/transactionsStore'
import SummaryCreditsCard from './SummaryCreditsCard'
import SummaryDebitsCard from './SummaryDebitsCard'
import SummaryCategoriesCard from './SummaryCategoriesCard'

type TransactionRow = Record<string, unknown>

/**
 * Every figure comes from the server aggregate for the table's whole filter when
 * it is available. The loaded rows are only a fallback, field by field, for a
 * backend that predates a field or a query still in flight: mixing the two was
 * how "Total Debits" ended up paired with a page-window count (#82).
 */
export default function SummaryStatsCards(props: {
  transactions: TransactionRow[]
  totals?: TransactionTotals
  categories?: [string, number][]
}): JSX.Element {
  const pageCredits = createMemo(() => {
    const rows = props.transactions.filter((t) => {
      const c = Number(t.amount_credit)
      return Number.isFinite(c) && c > 0
    })
    return { total: rows.reduce((s, t) => s + Math.abs(Number(t.amount_credit)), 0), count: rows.length }
  })

  const pageDebits = createMemo(() => {
    const rows = props.transactions.filter((t) => {
      const d = Number(t.amount_debit)
      return Number.isFinite(d) && d !== 0
    })
    return { total: rows.reduce((s, t) => s + Math.abs(Number(t.amount_debit)), 0), count: rows.length }
  })

  const credits = () => ({
    total: props.totals?.creditTotal ?? pageCredits().total,
    count: props.totals?.creditCount ?? pageCredits().count,
  })

  const debits = () => ({
    total: props.totals?.debitTotal ?? pageDebits().total,
    count: props.totals?.debitCount ?? pageDebits().count,
  })

  const pageCategorySpending = createMemo(() => {
    const map: Record<string, number> = {}
    for (const t of props.transactions) {
      const d = Number(t.amount_debit)
      if (!Number.isFinite(d) || d === 0) continue
      const cat =
        typeof t.budget_category === 'string' && t.budget_category ? t.budget_category : 'Uncategorized'
      map[cat] = (map[cat] ?? 0) + Math.abs(d)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]) as [string, number][]
  })

  const categorySpending = () => props.categories ?? pageCategorySpending()

  return (
    <Show when={transactionsState.viewMode !== null}>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <SummaryCreditsCard total={credits().total} count={credits().count} />
        <SummaryDebitsCard total={debits().total} count={debits().count} />
        <SummaryCategoriesCard categories={categorySpending()} />
      </div>
    </Show>
  )
}
