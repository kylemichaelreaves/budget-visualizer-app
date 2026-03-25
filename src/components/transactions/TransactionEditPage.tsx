import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import { useParams } from '@solidjs/router'
import usePendingTransaction from '@api/hooks/transactions/usePendingTransaction'
import useTransaction from '@api/hooks/transactions/useTransaction'
import type { PendingTransaction, Transaction } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import TransactionEditForm from '@components/transactions/TransactionEditForm'

function isPendingRow(obj: unknown): obj is PendingTransaction {
  return typeof obj === 'object' && obj !== null && 'transaction_data' in obj && 'status' in obj
}

function transactionFromPending(data: PendingTransaction): Transaction | null {
  const td = data.transaction_data
  if (typeof td === 'string') {
    try {
      return JSON.parse(td) as Transaction
    } catch {
      return null
    }
  }
  return td as Transaction
}

export default function TransactionEditPage(): JSX.Element {
  const params = useParams<{
    transactionId?: string
    pendingTransactionId?: string
  }>()

  const isPending = () => !!params.pendingTransactionId
  const entityId = () => Number(params.pendingTransactionId ?? params.transactionId)

  const pendingId = () => (isPending() && !Number.isNaN(entityId()) ? entityId() : undefined)
  const normalId = () => (!isPending() && !Number.isNaN(entityId()) ? entityId() : undefined)

  const pendingQ = usePendingTransaction(pendingId)
  const txnQ = useTransaction(normalId)

  const loading = () =>
    isPending() ? pendingQ.isLoading || pendingQ.isFetching : txnQ.isLoading || txnQ.isFetching
  const error = () => (isPending() ? pendingQ.error : txnQ.error)
  const isError = () => (isPending() ? pendingQ.isError : txnQ.isError)

  const transaction = createMemo((): Transaction | null => {
    if (isPending()) {
      const data = pendingQ.data
      if (!data) return null
      return transactionFromPending(data)
    }
    const data = txnQ.data
    if (!data) return null
    if (isPendingRow(data)) {
      return transactionFromPending(data)
    }
    return data as Transaction
  })

  return (
    <div style={{ padding: '20px', color: '#ecf0f1' }}>
      <header style={{ 'margin-bottom': '16px' }}>
        <button type="button" onClick={() => window.history.back()}>
          Back
        </button>
        <h1 style={{ 'margin-top': '12px' }}>
          {isPending() ? 'Edit Pending Transaction' : 'Edit Transaction'} {entityId()}
        </h1>
      </header>

      <Show when={isError() && error()}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name || 'Error'}
            message={(err() as Error).message || 'An error occurred while loading the transaction'}
            dataTestId="transaction-edit-error-alert"
          />
        )}
      </Show>

      <Show when={loading()}>
        <p data-testid="transaction-edit-loading">Loading…</p>
      </Show>

      <Show when={!loading() && !isError() && transaction()}>
        <TransactionEditForm
          transaction={transaction()!}
          dataTestId="transaction-edit-page-form"
          isPending={isPending()}
          pendingTransactionId={isPending() ? Number(params.pendingTransactionId) : undefined}
          onClose={() => window.history.back()}
        />
      </Show>

      <Show when={!loading() && !isError() && !transaction()}>
        <AlertComponent
          type="warning"
          title="Transaction Not Found"
          message="The requested transaction could not be found."
          dataTestId="transaction-not-found-alert"
        />
      </Show>
    </div>
  )
}
