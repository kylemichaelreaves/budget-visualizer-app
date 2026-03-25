import { A, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import AlertComponent from '@components/shared/AlertComponent'
import StatisticComponent from '@components/shared/StatisticComponent'
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
    <div style={{ padding: '8px 0', color: '#ecf0f1' }}>
      <Show when={invalidId()}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The memo URL must use a numeric memo id."
          dataTestId="memo-summary-invalid-id"
        />
      </Show>

      <Show when={!invalidId()}>
        <header
          style={{
            display: 'flex',
            'flex-wrap': 'wrap',
            'align-items': 'baseline',
            gap: '12px',
            'margin-bottom': '16px',
          }}
        >
          <h1 style={{ margin: 0, flex: '1 1 auto' }} data-testid="memo-summary-title">
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
          <p style={{ color: '#95a5a6' }}>Loading summary…</p>
        </Show>

        <Show when={summaryQ.data}>
          {(s) => (
            <div
              style={{
                display: 'flex',
                'flex-wrap': 'wrap',
                gap: '16px',
                margin: '12px 0',
              }}
            >
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
            </div>
          )}
        </Show>

        <h2 style={{ color: '#ecf0f1', 'font-size': '1.1rem', 'margin-bottom': '8px' }}>Transactions</h2>

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
          <p style={{ color: '#95a5a6' }}>Loading transactions…</p>
        </Show>

        <Show when={!txQ.isLoading && !txQ.isFetching && (txQ.data?.length ?? 0) > 0}>
          <table
            data-testid="memo-summary-transactions-table"
            style={{
              width: '100%',
              'border-collapse': 'collapse',
              'font-size': '0.85rem',
            }}
          >
            <thead>
              <tr style={{ 'border-bottom': '1px solid #555' }}>
                <For each={txColumns}>
                  {(key) => (
                    <th style={{ padding: '8px 6px', 'text-align': 'left' }}>
                      {key === 'link' ? '' : String(key).replace(/_/g, ' ')}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={txQ.data ?? []}>
                {(row) => (
                  <tr style={{ 'border-bottom': '1px solid #444' }}>
                    <For each={txColumns}>
                      {(key) => (
                        <td style={{ padding: '8px 6px' }}>
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
          <p style={{ color: '#95a5a6' }}>No transactions for this memo.</p>
        </Show>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            'flex-wrap': 'wrap',
            margin: '12px 0',
          }}
        >
          <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <span style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>Rows</span>
            <select
              value={txLimit()}
              onChange={(e) => {
                setTxLimit(Number(e.currentTarget.value))
                setTxOffset(0)
              }}
              style={{ padding: '6px', 'border-radius': '4px' }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button type="button" onClick={goPrevTx} disabled={!canPrev()}>
            Previous
          </button>
          <button type="button" onClick={goNextTx} disabled={!canNext()}>
            Next
          </button>
          <span style={{ color: '#95a5a6', 'font-size': '0.85rem' }}>
            Offset {txOffset()}
            {summaryQ.data?.transactions_count != null ? ` / ${summaryQ.data.transactions_count} total` : ''}
          </span>
        </div>
      </Show>
    </div>
  )
}
