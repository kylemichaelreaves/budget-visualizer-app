import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import type { Transaction } from '@types'
import { signedUsdToneClass } from '@components/shared/SignedUsdAmount'
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
        <span class={signedUsdToneClass('debit')}>{formatUsd(row().amount_debit)}</span>
      </Show>
      <Show when={props.hasCredit()}>
        <span class={signedUsdToneClass('credit')}>+{formatUsd(row().amount_credit)}</span>
      </Show>
      <Show when={row().balance != null}>
        <span class="text-sm text-muted-foreground">Bal: {formatUsd(row().balance)}</span>
      </Show>
    </div>
  )
}
