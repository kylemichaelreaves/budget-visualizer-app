import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import useMonthSummary from '@api/hooks/timeUnits/months/useMonthSummary'
import AlertComponent from '@components/shared/AlertComponent'
import { transactionsState } from '@stores/transactionsStore'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function MonthSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useMonthSummary()
  const id = () => props.dataTestId ?? 'month-summary-table'

  return (
    <Show when={transactionsState.selectedMonth}>
      <div data-testid={id()} style={{ margin: '12px 0' }}>
        <h3 style={{ color: '#ecf0f1', 'margin-bottom': '8px' }}>
          Month summary — {transactionsState.selectedMonth}
        </h3>
        <Show when={q.isError && q.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId={`${id()}-error`}
            />
          )}
        </Show>
        <Show when={q.isLoading || q.isFetching}>
          <p style={{ color: '#95a5a6' }}>Loading month summary…</p>
        </Show>
        <Show when={!q.isLoading && !q.isFetching && q.data}>
          <table
            style={{
              width: '100%',
              'border-collapse': 'collapse',
              color: '#ecf0f1',
              'font-size': '0.85rem',
            }}
          >
            <thead>
              <tr style={{ 'border-bottom': '1px solid #555' }}>
                <th style={{ padding: '8px 6px', 'text-align': 'left' }}>Memo</th>
                <th style={{ padding: '8px 6px', 'text-align': 'left' }}>Budget category</th>
                <th style={{ padding: '8px 6px', 'text-align': 'right' }}>Total debit</th>
              </tr>
            </thead>
            <tbody>
              <For each={q.data ?? []}>
                {(row) => (
                  <tr style={{ 'border-bottom': '1px solid #444' }}>
                    <td style={{ padding: '8px 6px' }}>
                      <MemoCell memo={row.memo} />
                    </td>
                    <td style={{ padding: '8px 6px' }}>{row.budget_category}</td>
                    <td style={{ padding: '8px 6px', 'text-align': 'right' }}>
                      {formatCurrency(row.total_amount_debit)}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </Show>
  )
}

function MemoCell(props: { memo: string }): JSX.Element {
  const m = () => props.memo
  const asNum = () => {
    const n = Number(m())
    return Number.isFinite(n) && String(n) === m().trim() ? n : null
  }
  return (
    <Show when={asNum() != null} fallback={<span>{m()}</span>}>
      <A href={`/budget-visualizer/memos/${asNum()}/summary`} data-testid="month-summary-memo-link">
        {m()}
      </A>
    </Show>
  )
}
