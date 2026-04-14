import type { MemoSummary, Transaction } from '@types'
import type { MemoSummaryCreditAggregate, MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'

export function computeTotalCredits(
  summaryData: MemoSummary | undefined,
  txns: Transaction[],
): MemoSummaryCreditAggregate {
  const apiCredit = summaryData?.sum_amount_credit
  if (apiCredit != null && Number.isFinite(apiCredit)) {
    return { sum: apiCredit, creditTxnCount: null, aggregateScope: 'memo' }
  }
  let sum = 0
  let count = 0
  for (const tx of txns) {
    const credit =
      typeof tx.amount_credit === 'string'
        ? parseFloat(tx.amount_credit)
        : ((tx.amount_credit as unknown as number) ?? 0)
    if (Number.isFinite(credit) && credit > 0) {
      sum += credit
      count++
    }
  }
  return { sum, creditTxnCount: count, aggregateScope: 'page' }
}

export function computeTotalDebits(
  summaryData: MemoSummary | undefined,
  txns: Transaction[],
): MemoSummaryDebitAggregate {
  const apiDebit = summaryData?.sum_amount_debit
  if (apiDebit != null && Number.isFinite(apiDebit)) {
    return { sum: apiDebit, debitTxnCount: null, aggregateScope: 'memo' }
  }
  let sum = 0
  let count = 0
  for (const tx of txns) {
    const debit =
      typeof tx.amount_debit === 'string'
        ? parseFloat(tx.amount_debit)
        : ((tx.amount_debit as unknown as number) ?? 0)
    if (Number.isFinite(debit) && debit !== 0) {
      sum += Math.abs(debit)
      count++
    }
  }
  return { sum, debitTxnCount: count, aggregateScope: 'page' }
}
