import { A, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { formatDate } from '@api/helpers/formatDate'
import { httpClient } from '@api/httpClient'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import AlertComponent from '@components/shared/AlertComponent'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { setSelectedMemo } from '@stores/transactionsStore'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import type { Frequency } from '@types'

// ── Inline SVG icons ──────────────────────────────────────────────────

function ChevronLeftIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function WarningTriangleIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-3.5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function CheckCircleIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-3.5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function RefreshIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-3.5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

function ArrowUpCircleIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m16 12-4-4-4 4" />
      <path d="M12 16V8" />
    </svg>
  )
}

function ArrowDownCircleIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 4 4 4-4" />
      <path d="M12 8v8" />
    </svg>
  )
}

function LayoutGridIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

function TrendingUpIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function TrendingDownIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (num == null || Number.isNaN(num)) return '$0.00'
  return `$${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const FREQUENCY_OPTIONS: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly']

// ── Component ─────────────────────────────────────────────────────────

export default function MemoSummaryTable(): JSX.Element {
  const params = useParams<{ memoId: string }>()
  const queryClient = useQueryClient()

  const memoIdNum = createMemo(() => {
    const n = Number(params.memoId)
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined
  })

  const memoQ = useMemoById({ memoId: () => memoIdNum() ?? null })
  const summaryQ = useMemoSummary(() => memoIdNum())
  const [txLimit, setTxLimit] = createSignal(50)
  const [txOffset, setTxOffset] = createSignal(0)
  const txQ = useMemoTransactionsPage(() => memoIdNum(), txLimit, txOffset)

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  createEffect(
    on(
      () => memoQ.data,
      (memo) => {
        if (memo?.name) setSelectedMemo(memo.name, memo.id)
      },
      { defer: true },
    ),
  )

  // ── Pagination ──────────────────────────────────────────────────────

  const canPrev = () => txOffset() > 0
  const canNext = () => {
    const rows = txQ.data?.length ?? 0
    const cap = summaryQ.data?.transactions_count
    if (cap != null) {
      return txOffset() + rows < cap
    }
    return rows >= txLimit()
  }

  function goPrevTx() {
    if (!canPrev()) return
    setTxOffset(Math.max(0, txOffset() - txLimit()))
  }

  function goNextTx() {
    if (!canNext()) return
    setTxOffset(txOffset() + txLimit())
  }

  // ── Derived memo data ───────────────────────────────────────────────

  const memo = () => memoQ.data
  const isAmbiguous = () => memo()?.ambiguous ?? false
  const isRecurring = () => memo()?.recurring ?? false
  const isNecessary = () => memo()?.necessary ?? false
  const budgetCategory = () => memo()?.budget_category ?? null
  const frequency = () => memo()?.frequency ?? undefined
  const isResolved = () => !isAmbiguous() && !!budgetCategory()

  // Compute credits from transaction list
  const totalCredits = createMemo(() => {
    const txns = txQ.data ?? []
    let sum = 0
    let count = 0
    for (const tx of txns) {
      const credit =
        typeof tx.amount_credit === 'string'
          ? parseFloat(tx.amount_credit)
          : ((tx.amount_credit as unknown as number) ?? 0)
      if (credit > 0) {
        sum += credit
        count++
      }
    }
    return { sum, count }
  })

  const totalDebits = createMemo(() => {
    const s = summaryQ.data
    return { sum: s?.sum_amount_debit ?? 0, count: s?.transactions_count ?? 0 }
  })

  // ── Mutations ───────────────────────────────────────────────────────

  async function patchMemo(fields: Record<string, unknown>) {
    const m = memo()
    if (!m) return
    setSaving(true)
    try {
      await httpClient.patch(`/memos/${m.id}`, {
        name: m.name,
        ...fields,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['memo'] }),
        queryClient.invalidateQueries({ queryKey: ['memo-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['memos'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
    } finally {
      setSaving(false)
    }
  }

  function handleCategorySelect(value: string) {
    patchMemo({ budgetCategory: value })
  }

  function handleAmbiguousChange(checked: boolean) {
    patchMemo({ ambiguous: checked })
  }

  function handleRecurringChange(checked: boolean) {
    patchMemo({ recurring: checked, ...(checked ? {} : { frequency: null }) })
  }

  function handleNecessaryChange(checked: boolean) {
    patchMemo({ necessary: checked })
  }

  function handleFrequencyChange(value: string) {
    patchMemo({ frequency: value, recurring: true })
  }

  // ── Render ──────────────────────────────────────────────────────────

  const invalidId = () => memoIdNum() == null

  return (
    <div class="py-2 text-foreground max-w-5xl mx-auto">
      <Show when={invalidId()}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The memo URL must use a numeric memo id."
          dataTestId="memo-summary-invalid-id"
        />
      </Show>

      <Show when={!invalidId()}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <header class="mb-6">
          <div class="flex items-center gap-3 flex-wrap">
            <A
              href="/budget-visualizer/memos"
              class="inline-flex items-center justify-center rounded-md border border-input bg-background p-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="memo-summary-back-to-list"
            >
              <ChevronLeftIcon class="size-5" />
            </A>

            <h1 class="text-2xl font-bold m-0 flex-1" data-testid="memo-summary-title">
              {memo()?.name ?? `Memo ${params.memoId}`}
            </h1>

            <div class="flex items-center gap-2 flex-wrap">
              <Show when={isAmbiguous()}>
                <Badge variant="outline" class="border-amber-500/50 text-amber-600 dark:text-amber-400">
                  <WarningTriangleIcon class="size-3.5" />
                  Ambiguous
                </Badge>
              </Show>
              <Show when={isResolved()}>
                <Badge variant="outline" class="border-green-500/50 text-green-600 dark:text-green-400">
                  <CheckCircleIcon class="size-3.5" />
                  Resolved
                </Badge>
              </Show>
              <Show when={isRecurring()}>
                <Badge variant="outline" class="border-blue-500/50 text-blue-600 dark:text-blue-400">
                  <RefreshIcon class="size-3.5" />
                  {frequency() ?? 'Recurring'}
                </Badge>
              </Show>
            </div>
          </div>

          <p class="text-muted-foreground mt-1 mb-0">
            {summaryQ.data?.transactions_count ?? '...'} transactions
          </p>
        </header>

        {/* ── Errors ─────────────────────────────────────────────── */}
        <Show when={memoQ.isError && memoQ.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId="memo-summary-memo-error"
            />
          )}
        </Show>

        <Show when={summaryQ.isError && summaryQ.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId="memo-summary-stats-error"
            />
          )}
        </Show>

        {/* ── Summary cards (3-column grid) ──────────────────────── */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Credits */}
          <Card>
            <CardContent class="pt-5 pb-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="rounded-full bg-green-100 dark:bg-green-900/40 p-2">
                  <ArrowUpCircleIcon class="size-5 text-green-600 dark:text-green-400" />
                </div>
                <span class="text-sm font-medium text-muted-foreground">Total Credits</span>
              </div>
              <p
                class="text-2xl font-bold text-green-600 dark:text-green-400 m-0"
                data-testid="memo-summary-total-credit"
              >
                {formatCurrency(totalCredits().sum)}
              </p>
              <p class="text-xs text-muted-foreground mt-1 m-0">
                {totalCredits().count} transaction{totalCredits().count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Total Debits */}
          <Card>
            <CardContent class="pt-5 pb-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="rounded-full bg-red-100 dark:bg-red-900/40 p-2">
                  <ArrowDownCircleIcon class="size-5 text-red-600 dark:text-red-400" />
                </div>
                <span class="text-sm font-medium text-muted-foreground">Total Debits</span>
              </div>
              <p
                class="text-2xl font-bold text-red-600 dark:text-red-400 m-0"
                data-testid="memo-summary-total-debit"
              >
                {formatCurrency(totalDebits().sum)}
              </p>
              <p class="text-xs text-muted-foreground mt-1 m-0">
                {totalDebits().count} transaction{totalDebits().count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Budget Category card */}
          <Card>
            <CardContent class="pt-5 pb-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="rounded-full bg-violet-100 dark:bg-violet-900/40 p-2">
                  <LayoutGridIcon class="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span class="text-sm font-medium text-muted-foreground">Budget Category</span>
              </div>

              {/* Category pill */}
              <div class="mb-3">
                <Show
                  when={budgetCategory()}
                  fallback={
                    <button
                      type="button"
                      onClick={() => setCategoryDialogOpen(true)}
                      class="text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-full px-3 py-1 transition-colors"
                    >
                      + Assign category
                    </button>
                  }
                >
                  <button
                    type="button"
                    onClick={() => setCategoryDialogOpen(true)}
                    class="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors cursor-pointer"
                  >
                    {budgetCategory()}
                  </button>
                </Show>
              </div>

              {/* Checkboxes */}
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAmbiguous()}
                    disabled={saving()}
                    onChange={(e) => handleAmbiguousChange(e.currentTarget.checked)}
                    class="rounded border-border accent-amber-500"
                  />
                  <span>Ambiguous category</span>
                </label>

                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring()}
                    disabled={saving()}
                    onChange={(e) => handleRecurringChange(e.currentTarget.checked)}
                    class="rounded border-border accent-blue-500"
                  />
                  <span>Recurring</span>
                  <Show when={isRecurring()}>
                    <select
                      value={frequency() ?? ''}
                      onChange={(e) => handleFrequencyChange(e.currentTarget.value)}
                      disabled={saving()}
                      class="ml-1 text-xs border border-input rounded px-1.5 py-0.5 bg-background"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">interval...</option>
                      <For each={FREQUENCY_OPTIONS}>{(f) => <option value={f}>{f}</option>}</For>
                    </select>
                  </Show>
                </label>

                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNecessary()}
                    disabled={saving()}
                    onChange={(e) => handleNecessaryChange(e.currentTarget.checked)}
                    class="rounded border-border accent-green-500"
                  />
                  <span>Necessary purchase</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Category dialog ────────────────────────────────────── */}
        <CategoryTreeSelectDialog
          open={categoryDialogOpen()}
          onOpenChange={setCategoryDialogOpen}
          value={budgetCategory() ?? ''}
          onSelect={handleCategorySelect}
          title="Assign Budget Category"
          subtitle={memo()?.name}
        />

        {/* ── Transactions list card ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Show when={txQ.isError && txQ.error}>
              {(err) => (
                <AlertComponent
                  type="error"
                  title={(err() as Error).name}
                  message={(err() as Error).message}
                  dataTestId="memo-summary-tx-error"
                />
              )}
            </Show>

            <Show when={txQ.isLoading || txQ.isFetching}>
              <p class="text-muted-foreground">Loading transactions...</p>
            </Show>

            <Show when={!txQ.isLoading && !txQ.isFetching && (txQ.data?.length ?? 0) > 0}>
              <div class="divide-y divide-border" data-testid="memo-summary-transactions-table">
                <For each={txQ.data ?? []}>
                  {(row) => {
                    const debit = () => parseFloat(String(row.amount_debit ?? '0'))
                    const credit = () => parseFloat(String(row.amount_credit ?? '0'))
                    const isCredit = () => credit() > 0 && debit() === 0

                    return (
                      <div class="flex items-center gap-3 py-3 px-1">
                        {/* Icon */}
                        <div
                          class={`rounded-full p-1.5 ${isCredit() ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}
                        >
                          <Show
                            when={isCredit()}
                            fallback={<TrendingDownIcon class={`size-4 text-red-600 dark:text-red-400`} />}
                          >
                            <TrendingUpIcon class={`size-4 text-green-600 dark:text-green-400`} />
                          </Show>
                        </div>

                        {/* Description + date */}
                        <div class="flex-1 min-w-0">
                          <Show
                            when={row.id != null}
                            fallback={<p class="text-sm font-medium truncate m-0">{row.description}</p>}
                          >
                            <A
                              href={`/budget-visualizer/transactions/${row.id}/edit`}
                              class="text-sm font-medium truncate block hover:underline"
                              data-testid={`memo-summary-tx-edit-${row.id}`}
                            >
                              {row.description}
                            </A>
                          </Show>
                          <p class="text-xs text-muted-foreground m-0">
                            {formatDate(String(row.date ?? ''))}
                          </p>
                        </div>

                        {/* Category */}
                        <Show when={typeof row.budget_category === 'string' && row.budget_category}>
                          <Badge variant="secondary" class="hidden sm:inline-flex text-xs">
                            {row.budget_category as string}
                          </Badge>
                        </Show>

                        {/* Amount */}
                        <span
                          class={`text-sm font-semibold tabular-nums whitespace-nowrap ${isCredit() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {isCredit() ? '+' : '-'}
                          {formatCurrency(isCredit() ? credit() : debit())}
                        </span>
                      </div>
                    )
                  }}
                </For>
              </div>
            </Show>

            <Show when={!txQ.isLoading && !txQ.isFetching && (txQ.data?.length ?? 0) === 0}>
              <p class="text-muted-foreground">No transactions for this memo.</p>
            </Show>

            {/* ── Pagination controls ──────────────────────────────── */}
            <div class="flex items-center gap-3 flex-wrap mt-4 pt-3 border-t border-border">
              <label class="flex items-center gap-2">
                <span class="text-muted-foreground text-sm">Rows</span>
                <select
                  value={txLimit()}
                  onChange={(e) => {
                    setTxLimit(Number(e.currentTarget.value))
                    setTxOffset(0)
                  }}
                  class="p-1.5 rounded border border-input bg-background text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <Button variant="outline" size="sm" type="button" onClick={goPrevTx} disabled={!canPrev()}>
                Previous
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={goNextTx} disabled={!canNext()}>
                Next
              </Button>
              <span class="text-muted-foreground text-sm">
                Offset {txOffset()}
                {summaryQ.data?.transactions_count != null
                  ? ` / ${summaryQ.data.transactions_count} total`
                  : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      </Show>
    </div>
  )
}
