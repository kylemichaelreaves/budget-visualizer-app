import { A, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import AlertComponent from '@components/shared/AlertComponent'
import StatisticComponent from '@components/shared/StatisticComponent'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import type { Transaction } from '@types'

const txColumns: (keyof Transaction | 'link')[] = [
  'id',
  'date',
  'description',
  'amount_debit',
  'amount_credit',
  'budget_category',
  'link',
]

function formatHeader(id: string, name: string | undefined): string {
  if (name) return `Memo: ${name}`
  return `Memo ${id}`
}

export default function MemoSummaryTable(): JSX.Element {
  const params = useParams<{ memoId: string }>()

  const memoIdNum = createMemo(() => {
    const n = Number(params.memoId)
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined
  })

  const memoQ = useMemoById({ memoId: () => memoIdNum() ?? null })
  const summaryQ = useMemoSummary(() => memoIdNum())
  const [txLimit, setTxLimit] = createSignal(50)
  const [txOffset, setTxOffset] = createSignal(0)
  const txQ = useMemoTransactionsPage(() => memoIdNum(), txLimit, txOffset)

  const displayName = () => memoQ.data?.name

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

  const invalidId = () => memoIdNum() == null

  return (
    <div class="py-2 text-foreground">
      <Show when={invalidId()}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The memo URL must use a numeric memo id."
          dataTestId="memo-summary-invalid-id"
        />
      </Show>

      <Show when={!invalidId()}>
        <header class="flex flex-wrap items-baseline gap-3 mb-4">
          <h1 class="m-0 flex-auto" data-testid="memo-summary-title">
            {formatHeader(params.memoId, displayName())}
          </h1>
          <A href={`/budget-visualizer/memos/${params.memoId}/edit`} data-testid="memo-summary-edit-link">
            Edit memo
          </A>
          <A href="/budget-visualizer/memos" data-testid="memo-summary-back-to-list">
            All memos
          </A>
        </header>

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

        <Show when={summaryQ.isLoading || summaryQ.isFetching}>
          <p class="text-muted-foreground">Loading summary...</p>
        </Show>

        <Show when={summaryQ.data}>
          {(s) => (
            <Card class="my-3">
              <CardContent class="flex flex-wrap gap-4 pt-4">
                <StatisticComponent
                  title="Total debit"
                  value={s().sum_amount_debit}
                  dataTestId="memo-summary-total-debit"
                  precision={2}
                />
                <StatisticComponent
                  title="Transactions"
                  value={s().transactions_count}
                  dataTestId="memo-summary-tx-count"
                />
              </CardContent>
            </Card>
          )}
        </Show>

        <Card class="my-3">
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
              <table
                data-testid="memo-summary-transactions-table"
                class="w-full border-collapse text-sm"
              >
                <thead>
                  <tr class="border-b border-border">
                    <For each={txColumns}>
                      {(key) => (
                        <th class="px-1.5 py-2 text-left">
                          {key === 'link' ? '' : String(key).replace(/_/g, ' ')}
                        </th>
                      )}
                    </For>
                  </tr>
                </thead>
                <tbody>
                  <For each={txQ.data ?? []}>
                    {(row) => (
                      <tr class="border-b border-border">
                        <For each={txColumns}>
                          {(key) => (
                            <td class="px-1.5 py-2">
                              {key === 'link' ? (
                                row.id != null ? (
                                  <A
                                    href={`/budget-visualizer/transactions/${row.id}/edit`}
                                    data-testid={`memo-summary-tx-edit-${row.id}`}
                                  >
                                    Edit
                                  </A>
                                ) : (
                                  '—'
                                )
                              ) : key === 'date' ? (
                                formatDate(String((row as Transaction)[key] ?? ''))
                              ) : (
                                String((row as Record<string, unknown>)[key as string] ?? '—')
                              )}
                            </td>
                          )}
                        </For>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>

            <Show when={!txQ.isLoading && !txQ.isFetching && (txQ.data?.length ?? 0) === 0}>
              <p class="text-muted-foreground">No transactions for this memo.</p>
            </Show>

            <div class="flex items-center gap-3 flex-wrap my-3">
              <label class="flex items-center gap-2">
                <span class="text-muted-foreground text-sm">Rows</span>
                <select
                  value={txLimit()}
                  onChange={(e) => {
                    setTxLimit(Number(e.currentTarget.value))
                    setTxOffset(0)
                  }}
                  class="p-1.5 rounded"
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
                {summaryQ.data?.transactions_count != null ? ` / ${summaryQ.data.transactions_count} total` : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      </Show>
    </div>
  )
}
