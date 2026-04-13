import { createEffect, createMemo, createSignal, on } from 'solid-js'
import usePendingTransactions from '@api/hooks/transactions/usePendingTransactions'
import {
  clearPendingTransactionsByOffset,
  setSelectedStatus,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import type { PendingTransaction, Transaction } from '@types'
import { parseRow } from './pendingTransactionsTableUtils'

export function usePendingTransactionsTable() {
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

  function openModal(row: PendingTransaction) {
    setEditTxn(parseRow(row))
    setPendingId(row.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTxn(null)
    setPendingId(undefined)
  }

  return {
    query,
    modalOpen,
    editTxn,
    pendingId,
    viewMode,
    setViewMode,
    isLoadingCondition,
    LIMIT,
    paginatedData,
    isPaginationDisabled,
    openModal,
    closeModal,
  }
}
