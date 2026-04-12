import type { Accessor } from 'solid-js'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { createTransactionsTableRowMoney } from '@components/transactions/createTransactionsTableRowMoney'
import TransactionsTableRowAmounts from '@components/transactions/TransactionsTableRowAmounts'
import TransactionsTableRowCategoryColumn from '@components/transactions/TransactionsTableRowCategoryColumn'
import TransactionsTableRowPrimaryColumn from '@components/transactions/TransactionsTableRowPrimaryColumn'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

export default function TransactionsTableRow(props: {
  row: Transaction
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
}) {
  const row = () => props.row
  const money = createTransactionsTableRowMoney(row)

  return (
    <li class="grid grid-cols-[2fr_1fr_150px] items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
      <TransactionsTableRowPrimaryColumn row={props.row} isCredit={money.isCredit} />

      <TransactionsTableRowCategoryColumn
        row={props.row}
        isCredit={money.isCredit}
        categoryColors={props.categoryColors}
        mutatingTransactionId={props.mutatingTransactionId}
        openCategoryDialog={props.openCategoryDialog}
      />

      <TransactionsTableRowAmounts row={props.row} hasDebit={money.hasDebit} hasCredit={money.hasCredit} />
    </li>
  )
}
