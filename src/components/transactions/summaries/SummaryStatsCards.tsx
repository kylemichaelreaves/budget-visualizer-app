import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'
import SummaryCreditsCard from './SummaryCreditsCard'
import SummaryDebitsCard from './SummaryDebitsCard'
import SummaryCategoriesCard from './SummaryCategoriesCard'

type TransactionRow = Record<string, unknown>

export default function SummaryStatsCards(props: { transactions: TransactionRow[] }): JSX.Element {
  const credits = createMemo(() => {
    const rows = props.transactions.filter((t) => {
      const c = Number(t.amount_credit)
      return Number.isFinite(c) && c > 0
    })
    const total = rows.reduce((s, t) => s + Math.abs(Number(t.amount_credit)), 0)
    return { total, count: rows.length }
  })

  const debits = createMemo(() => {
    const rows = props.transactions.filter((t) => {
      const d = Number(t.amount_debit)
      return Number.isFinite(d) && d !== 0
    })
    const total = rows.reduce((s, t) => s + Math.abs(Number(t.amount_debit)), 0)
    return { total, count: rows.length }
  })

  const categorySpending = createMemo(() => {
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
