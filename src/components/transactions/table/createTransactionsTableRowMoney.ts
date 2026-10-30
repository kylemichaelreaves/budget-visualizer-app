import type { Accessor } from 'solid-js'
import type { Transaction } from '@types'
import { isNonZeroAmount } from '@components/transactions/helpers/isNonZeroAmount'

export function createTransactionsTableRowMoney(row: Accessor<Transaction>) {
  const debit = () => Number(row().amount_debit)
  const credit = () => Number(row().amount_credit)
  const hasDebit = () => isNonZeroAmount(row().amount_debit)
  const hasCredit = () => isNonZeroAmount(row().amount_credit)
  const isCredit = () => hasCredit() && !hasDebit()

  return { debit, credit, hasDebit, hasCredit, isCredit }
}
