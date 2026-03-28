import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import useWeekSummary from '@api/hooks/timeUnits/weeks/useWeekSummary'
import AlertComponent from '@components/shared/AlertComponent'
import { transactionsState } from '@stores/transactionsStore'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function WeekSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useWeekSummary()
  const id = () => props.dataTestId ?? 'week-summary-table'

  return (
    <Show when={transactionsState.selectedWeek}>
      <div data-testid={id()} class="my-3">
        <h3 class="text-foreground mb-2">
          Week summary — {transactionsState.selectedWeek}
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
          <p class="text-muted-foreground">Loading week summary...</p>
        </Show>
        <Show when={!q.isLoading && !q.isFetching && q.data}>
          <table class="w-full border-collapse text-foreground text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="px-1.5 py-2 text-left">Memo</th>
                <th class="px-1.5 py-2 text-left">Budget category</th>
                <th class="px-1.5 py-2 text-right">Weekly debit</th>
              </tr>
            </thead>
            <tbody>
              <For each={q.data ?? []}>
                {(row) => (
                  <tr class="border-b border-border">
                    <td class="px-1.5 py-2">
                      <MemoCell memo={row.memo} />
                    </td>
                    <td class="px-1.5 py-2">{row.budget_category ?? '—'}</td>
                    <td class="px-1.5 py-2 text-right">
                      {formatCurrency(row.weekly_amount_debit)}
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
      <A href={`/budget-visualizer/memos/${asNum()}/summary`} data-testid="week-summary-memo-link">
        {m()}
      </A>
    </Show>
  )
}
