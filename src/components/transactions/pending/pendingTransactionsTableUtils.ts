import type { PendingTransaction, Transaction } from '@types'

export const transactionColumns = [
  { prop: 'id', label: 'ID' },
  { prop: 'transaction_date', label: 'Date' },
  { prop: 'transaction_data', label: 'Transaction Data' },
  { prop: 'memo_name', label: 'Memo' },
  { prop: 'amount_debit', label: 'Amount Debit' },
  { prop: 'assigned_category', label: 'Assigned Category' },
  { prop: 'status', label: 'Status' },
  { prop: 'created_at', label: 'Created At' },
  { prop: 'reviewed_at', label: 'Reviewed At' },
]

export function getCell(row: PendingTransaction, prop: string): unknown {
  if (prop === 'memo_name') return row.memo_name ?? (row as unknown as { memo?: string }).memo
  return (row as unknown as Record<string, unknown>)[prop]
}

export function parseRow(row: PendingTransaction): Transaction {
  const raw = row.transaction_data
  let transactionData: Transaction | null
  if (typeof raw === 'string') {
    try {
      transactionData = JSON.parse(raw) as Transaction
    } catch {
      transactionData = null
    }
  } else {
    transactionData = raw as Transaction
  }
  return {
    id: row.id,
    transaction_number: transactionData?.transaction_number?.toString() || `PENDING-${row.id}`,
    date: transactionData?.date || '',
    description: transactionData?.description || '',
    memo: transactionData?.memo || '',
    amount_debit: transactionData?.amount_debit?.toString() || row.amount_debit || '0.00',
    amount_credit: transactionData?.amount_credit?.toString() || '0.00',
    balance: transactionData?.balance?.toString() || '',
    check_number: transactionData?.check_number || '',
    fees: transactionData?.fees?.toString() || '',
    budget_category: row.assigned_category || transactionData?.budget_category || '',
  }
}

export function formatCell(val: unknown): string {
  if (val == null) return 'N/A'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
