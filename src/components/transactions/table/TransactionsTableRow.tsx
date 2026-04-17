import type { Accessor } from 'solid-js'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { createTransactionsTableRowMoney } from '@components/transactions/table/createTransactionsTableRowMoney'
import TransactionsTableRowAmounts from '@components/transactions/table/TransactionsTableRowAmounts'
import TransactionsTableRowCategoryColumn from '@components/transactions/table/TransactionsTableRowCategoryColumn'
import TransactionsTableRowPrimaryColumn from '@components/transactions/table/TransactionsTableRowPrimaryColumn'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

export default function TransactionsTableRow(props: {
  row: Transaction
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
  openSplitDrawer?: (row: Transaction) => void
}) {
  const row = () => props.row
  const money = createTransactionsTableRowMoney(row)

  return (
    <li
      class="grid grid-cols-[2fr_1fr_150px] items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
      data-testid={row().id != null ? `transaction-row-${row().id}` : undefined}
    >
      <TransactionsTableRowPrimaryColumn row={props.row} isCredit={money.isCredit} />

      <TransactionsTableRowCategoryColumn
        row={props.row}
        isCredit={money.isCredit}
        categoryColors={props.categoryColors}
        mutatingTransactionId={props.mutatingTransactionId}
        openCategoryDialog={props.openCategoryDialog}
        openSplitDrawer={props.openSplitDrawer}
      />

      <TransactionsTableRowAmounts row={props.row} hasDebit={money.hasDebit} hasCredit={money.hasCredit} />
    </li>
  )
}
