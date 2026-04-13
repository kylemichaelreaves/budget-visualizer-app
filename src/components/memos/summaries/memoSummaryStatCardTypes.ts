export type MemoSummaryCreditAggregate = {
  sum: number
  creditTxnCount: number | null
  aggregateScope: 'memo' | 'page'
}

export type MemoSummaryDebitAggregate = {
  sum: number
  debitTxnCount: number | null
  aggregateScope: 'memo' | 'page'
}
