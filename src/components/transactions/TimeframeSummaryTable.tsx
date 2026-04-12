import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import { formatUsd } from '@utils/formatUsd'

export type TimeframeSummaryRow = {
  memo: string
  budget_category: string | null | undefined
  amount: number
}

export default function TimeframeSummaryTable(props: {
  dataTestId: string
  titleVerb: 'Month' | 'Week'
  selectedPeriod: () => string | undefined | null
  amountHeader: string
  loadingMessage: string
  memoLinkTestId: string
  rows: () => TimeframeSummaryRow[]
  isError: () => boolean
  error: () => unknown
  isLoading: () => boolean
  isFetching: () => boolean
  /** When true, render the result table (including empty `rows()`). */
  showTable: () => boolean
}): JSX.Element | null {
  const id = () => props.dataTestId

  return (
    <Show when={props.selectedPeriod()}>
      <div data-testid={id()} class="my-3">
        <h3 class="text-foreground mb-2">
          {props.titleVerb} summary — {props.selectedPeriod()}
        </h3>
        <Show when={props.isError() ? props.error() : undefined}>
          {(err) => {
            const value = err()
            const normalized =
              value instanceof Error ? value : new Error(typeof value === 'string' ? value : String(value))

            return (
              <AlertComponent
                type="error"
                title={normalized.name}
                message={normalized.message}
                dataTestId={`${id()}-error`}
              />
            )
          }}
        </Show>
        <Show when={props.isLoading() || props.isFetching()}>
          <p class="text-muted-foreground">{props.loadingMessage}</p>
        </Show>
        <Show when={props.showTable()}>
          <table class="w-full border-collapse text-foreground text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="px-1.5 py-2 text-left">Memo</th>
                <th class="px-1.5 py-2 text-left">Budget category</th>
                <th class="px-1.5 py-2 text-right">{props.amountHeader}</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.rows()}>
                {(row) => (
                  <tr class="border-b border-border">
                    <td class="px-1.5 py-2">
                      <MemoCell memo={row.memo} dataTestId={props.memoLinkTestId} />
                    </td>
                    <td class="px-1.5 py-2">{row.budget_category ?? '—'}</td>
                    <td class="px-1.5 py-2 text-right">{formatUsd(row.amount)}</td>
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

function MemoCell(props: { memo: string; dataTestId: string }): JSX.Element {
  const m = () => props.memo
  const asNum = () => {
    const n = Number(m())
    return Number.isFinite(n) && String(n) === m().trim() ? n : null
  }
  return (
    <Show when={asNum() != null} fallback={<span>{m()}</span>}>
      <A href={`/budget-visualizer/memos/${asNum()}/summary`} data-testid={props.dataTestId}>
        {m()}
      </A>
    </Show>
  )
}
