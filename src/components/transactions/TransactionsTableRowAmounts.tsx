import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import type { Transaction } from '@types'
import { formatUsd } from '@utils/formatUsd'

export default function TransactionsTableRowAmounts(props: {
  row: Transaction
  hasDebit: Accessor<boolean>
  hasCredit: Accessor<boolean>
}) {
  const row = () => props.row

  return (
    <div class="flex items-center justify-end gap-3">
      <Show when={props.hasDebit()}>
        <span class="font-semibold text-red-500">{formatUsd(row().amount_debit)}</span>
      </Show>
      <Show when={props.hasCredit()}>
        <span class="font-semibold text-green-500">+{formatUsd(row().amount_credit)}</span>
      </Show>
      <Show when={row().balance != null}>
        <span class="text-sm text-muted-foreground">Bal: {formatUsd(row().balance)}</span>
      </Show>
    </div>
  )
}
