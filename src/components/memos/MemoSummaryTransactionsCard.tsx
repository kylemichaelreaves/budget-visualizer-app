import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import type { Transaction } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import MemoSummaryTransactionRow from '@components/memos/MemoSummaryTransactionRow'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

export default function MemoSummaryTransactionsCard(props: {
  txIsError: Accessor<boolean>
  txError: Accessor<unknown>
  txIsLoading: Accessor<boolean>
  txIsFetching: Accessor<boolean>
  txRows: Accessor<Transaction[] | undefined>
  summaryTransactionsCount: Accessor<number | undefined>
  txLimit: Accessor<number>
  setTxLimit: (n: number) => void
  txOffset: Accessor<number>
  setTxOffset: (n: number) => void
  canPrev: Accessor<boolean>
  canNext: Accessor<boolean>
  goPrevTx: () => void
  goNextTx: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Show when={() => (props.txIsError() ? props.txError() : false)}>
          {(err) => {
            const e = err() as unknown
            const error = e instanceof Error ? e : new Error(String(e))
            return (
              <AlertComponent
                type="error"
                title={error.name}
                message={error.message}
                dataTestId="memo-summary-tx-error"
              />
            )
          }}
        </Show>

        <Show when={props.txIsLoading() || props.txIsFetching()}>
          <p class="text-muted-foreground">Loading transactions...</p>
        </Show>

        <Show when={!props.txIsLoading() && !props.txIsFetching() && (props.txRows()?.length ?? 0) > 0}>
          <div class="divide-y divide-border" data-testid="memo-summary-transactions-table">
            <For each={props.txRows() ?? []}>{(row) => <MemoSummaryTransactionRow row={row} />}</For>
          </div>
        </Show>

        <Show when={!props.txIsLoading() && !props.txIsFetching() && (props.txRows()?.length ?? 0) === 0}>
          <p class="text-muted-foreground">No transactions for this memo.</p>
        </Show>

        <div class="flex items-center gap-3 flex-wrap mt-4 pt-3 border-t border-border">
          <label class="flex items-center gap-2">
            <span class="text-muted-foreground text-sm">Rows</span>
            <select
              value={props.txLimit()}
              onChange={(e) => {
                props.setTxLimit(Number(e.currentTarget.value))
                props.setTxOffset(0)
              }}
              class="p-1.5 rounded border border-input bg-background text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={props.goPrevTx}
            disabled={!props.canPrev()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={props.goNextTx}
            disabled={!props.canNext()}
          >
            Next
          </Button>
          <span class="text-muted-foreground text-sm">
            Offset {props.txOffset()}
            {props.summaryTransactionsCount() != null ? ` / ${props.summaryTransactionsCount()} total` : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
