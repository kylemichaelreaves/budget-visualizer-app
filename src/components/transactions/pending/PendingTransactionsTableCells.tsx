import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Match, Show, Switch } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { PendingTransaction } from '@types'
import { formatCell, getCell } from './pendingTransactionsTableUtils'

export function PendingTransactionCell(props: { row: PendingTransaction; prop: string }): JSX.Element {
  return (
    <Switch fallback={<span>{formatCell(getCell(props.row, props.prop))}</span>}>
      <Match when={props.prop === 'id'}>
        <PendingTxnIdCell row={props.row} />
      </Match>
      <Match when={props.prop === 'transaction_date' || props.prop === 'created_at'}>
        <span>{formatDate(String(getCell(props.row, props.prop) ?? ''))}</span>
      </Match>
      <Match when={props.prop === 'reviewed_at'}>
        <PendingTxnReviewedAtCell row={props.row} />
      </Match>
      <Match when={props.prop === 'memo_name'}>
        <PendingTxnMemoNameCell row={props.row} />
      </Match>
    </Switch>
  )
}

function PendingTxnReviewedAtCell(props: { row: PendingTransaction }): JSX.Element {
  const v = () => getCell(props.row, 'reviewed_at')
  return <span>{v() ? formatDate(String(v())) : '—'}</span>
}

function PendingTxnIdCell(props: { row: PendingTransaction }): JSX.Element {
  const v = () => getCell(props.row, 'id')
  return (
    <A
      href={`/budget-visualizer/transactions/pending/${String(v() ?? '')}/edit`}
      data-testid={`pending-transaction-id-${v()}`}
    >
      {String(v() ?? '')}
    </A>
  )
}

function PendingTxnMemoNameCell(props: { row: PendingTransaction }): JSX.Element {
  const s = () => String(getCell(props.row, 'memo_name') ?? '')
  const memoNum = () => Number(s())
  const isId = () => Number.isFinite(memoNum()) && String(memoNum()) === s().trim()
  return (
    <Show when={isId()} fallback={<span>{s()}</span>}>
      <A href={`/budget-visualizer/memos/${memoNum()}/summary`} data-testid="memo-link">
        {s()}
      </A>
    </Show>
  )
}
