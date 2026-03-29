import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

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
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  })

  return (
    <Show when={transactionsState.viewMode !== null}>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Total Credits */}
        <Card data-testid="summary-credits-card">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Credits</CardTitle>
            <svg
              class="size-4 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="16 12 12 8 8 12" />
              <line x1="12" y1="16" x2="12" y2="8" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-500">+${currencyFormatter.format(credits().total)}</div>
            <p class="text-xs text-muted-foreground mt-1">
              {credits().count} income transaction{credits().count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Total Debits */}
        <Card data-testid="summary-debits-card">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Debits</CardTitle>
            <svg
              class="size-4 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="8 12 12 16 16 12" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-500">-${currencyFormatter.format(debits().total)}</div>
            <p class="text-xs text-muted-foreground mt-1">
              {debits().count} expense transaction{debits().count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* By Budget Category */}
        <Card data-testid="summary-categories-card">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">By Budget Category</CardTitle>
            <svg
              class="size-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </CardHeader>
          <CardContent class="pb-3">
            <Show
              when={categorySpending().length > 0}
              fallback={<p class="text-xs text-muted-foreground">No categorised expenses</p>}
            >
              <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                <For each={categorySpending()}>
                  {([cat, amt]) => (
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="size-2 rounded-full shrink-0 bg-muted-foreground" />
                        <span class="truncate text-muted-foreground">{cat}</span>
                      </div>
                      <span class="shrink-0 font-medium">${amt.toFixed(2)}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </CardContent>
        </Card>
      </div>
    </Show>
  )
}
