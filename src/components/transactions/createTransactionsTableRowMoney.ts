import type { Accessor } from 'solid-js'
import type { Transaction } from '@types'

export function createTransactionsTableRowMoney(row: Accessor<Transaction>) {
  const debit = () => Number(row().amount_debit)
  const credit = () => Number(row().amount_credit)
  const hasDebit = () => Number.isFinite(debit()) && debit() !== 0
  const hasCredit = () => Number.isFinite(credit()) && credit() !== 0
  const isCredit = () => hasCredit() && !hasDebit()

  return { debit, credit, hasDebit, hasCredit, isCredit }
}
