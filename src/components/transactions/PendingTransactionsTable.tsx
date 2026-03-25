import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import usePendingTransactions from '@api/hooks/transactions/usePendingTransactions'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import TransactionEditForm from '@components/transactions/TransactionEditForm'
import TransactionsTablePagination from '@components/transactions/TransactionsTablePagination'
import {
  clearPendingTransactionsByOffset,
  setSelectedStatus,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import type { PendingTransaction, Transaction } from '@types'

const transactionColumns = [
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

function getCell(row: PendingTransaction, prop: string): unknown {
  if (prop === 'memo_name') return row.memo_name ?? (row as unknown as { memo?: string }).memo
  return (row as unknown as Record<string, unknown>)[prop]
}

export default function PendingTransactionsTable(): JSX.Element {
  const query = usePendingTransactions()
  const [modalOpen, setModalOpen] = createSignal(false)
  const [editTxn, setEditTxn] = createSignal<Transaction | null>(null)
  const [pendingId, setPendingId] = createSignal<number | undefined>()

  const viewMode = () => transactionsState.selectedStatus
  const setViewMode = (v: 'pending' | 'reviewed') => {
    setSelectedStatus(v)
    clearPendingTransactionsByOffset()
  }

  createEffect(
    on(
      () => transactionsState.selectedStatus,
      () => {
        clearPendingTransactionsByOffset()
        updateTransactionsTableOffset(0)
        void query.refetch()
      },
    ),
  )

  const isLoadingCondition = () =>
    query.isLoading ||
    query.isFetching ||
    query.isRefetching ||
    query.isFetchingNextPage ||
    query.isFetchingPreviousPage

  const flattenedData = createMemo(() => query.data?.pages.flat() ?? [])

  const LIMIT = () => transactionsState.transactionsTableLimit

  const currentPage = () =>
    Math.floor(transactionsState.transactionsTableOffset / transactionsState.transactionsTableLimit) + 1

  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * LIMIT()
    return flattenedData().slice(start, start + LIMIT())
  })

  createEffect(
    on(
      () => currentPage(),
      () => {
        void loadMore()
      },
    ),
  )

  async function loadMore() {
    const need = currentPage() * LIMIT()
    while (flattenedData().length < need && query.hasNextPage) {
      await query.fetchNextPage()
    }
  }

  const isPaginationDisabled = () =>
    Boolean(
      transactionsState.selectedDay || transactionsState.selectedWeek || transactionsState.selectedMonth,
    )

  function parseRow(row: PendingTransaction): Transaction {
    let transactionData: Transaction | null = null
    const raw = row.transaction_data
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

  function openModal(row: PendingTransaction) {
    setEditTxn(parseRow(row))
    setPendingId(row.id)
    setModalOpen(true)
  }

  return (
    <>
      <Show when={query.isError && query.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name || 'Error'}
            message={(err() as Error).message || 'Failed to load pending transactions'}
            dataTestId="pending-transactions-table-error-alert"
          />
        )}
      </Show>

      <header
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '12px',
        }}
      >
        <h2 style={{ margin: 0, color: '#ecf0f1' }}>Pending Transactions</h2>
        <div role="tablist" data-testid="view-mode-segmented" style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            style={{ opacity: viewMode() === 'pending' ? 1 : 0.6 }}
            onClick={() => setViewMode('pending')}
          >
            Pending
          </button>
          <button
            type="button"
            style={{ opacity: viewMode() === 'reviewed' ? 1 : 0.6 }}
            onClick={() => setViewMode('reviewed')}
          >
            Reviewed
          </button>
        </div>
      </header>

      {modalOpen() && editTxn() ? (
        <dialog
          open
          style={{
            border: '1px solid #555',
            padding: '16px',
            background: '#2c2c2c',
            color: '#ecf0f1',
            width: 'min(90vw, 640px)',
          }}
        >
          <TransactionEditForm
            transaction={editTxn()!}
            isPending
            pendingTransactionId={pendingId()}
            onClose={() => {
              setModalOpen(false)
              setEditTxn(null)
              setPendingId(undefined)
            }}
          />
        </dialog>
      ) : null}

      <div onContextMenu={(e) => e.preventDefault()}>
        <Show when={isLoadingCondition()}>
          <TableSkeleton
            columns={transactionColumns.map((c) => ({ prop: c.prop, label: c.label }))}
            rows={LIMIT()}
            dataTestId="pending-transactions-table-skeleton"
          />
        </Show>
        <Show when={!isLoadingCondition()}>
          <table
            data-testid="pending-transactions-table"
            style={{ width: '100%', 'border-collapse': 'collapse', color: '#ecf0f1', 'font-size': '0.85rem' }}
          >
            <thead>
              <tr>
                <For each={transactionColumns}>
                  {(col) => <th style={{ border: '1px solid #555', padding: '6px' }}>{col.label}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={paginatedData()}>
                {(row) => (
                  <tr onContextMenu={() => openModal(row)}>
                    <For each={transactionColumns}>
                      {(col) => (
                        <td
                          style={{ border: '1px solid #444', padding: '6px' }}
                          data-testid={`column-${col.prop}`}
                        >
                          <Cell row={row} prop={col.prop} />
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <Show when={!isPaginationDisabled()}>
        <TransactionsTablePagination status={viewMode()} />
      </Show>
    </>
  )
}

function Cell(props: { row: PendingTransaction; prop: string }): JSX.Element {
  const p = props.prop
  const v = getCell(props.row, p)

  if (p === 'id') {
    return (
      <A
        href={`/budget-visualizer/transactions/pending/${String(v ?? '')}/edit`}
        data-testid={`pending-transaction-id-${v}`}
      >
        {String(v ?? '')}
      </A>
    )
  }

  if (p === 'transaction_date' || p === 'created_at') {
    return <span>{formatDate(String(v ?? ''))}</span>
  }

  if (p === 'reviewed_at') {
    return <span>{v ? formatDate(String(v)) : '—'}</span>
  }

  if (p === 'memo_name') {
    const s = String(v ?? '')
    const memoNum = Number(s)
    const isId = Number.isFinite(memoNum) && String(memoNum) === s.trim()
    if (isId) {
      return (
        <A href={`/budget-visualizer/memos/${memoNum}/summary`} data-testid="memo-link">
          {s}
        </A>
      )
    }
    return <span>{s}</span>
  }

  return <span>{formatCell(v)}</span>
}

function formatCell(val: unknown): string {
  if (val == null) return 'N/A'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
