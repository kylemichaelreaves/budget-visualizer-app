import { createEffect, createMemo, createSignal, on } from 'solid-js'
import usePendingTransactions from '@api/hooks/transactions/usePendingTransactions'
import { useInfiniteQueryPagePrefetch } from '@composables/infiniteQueryPagePrefetch'
import {
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
  }

  createEffect(
    on(
      () => transactionsState.selectedStatus,
      () => {
        updateTransactionsTableOffset(0)
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

  useInfiniteQueryPagePrefetch(currentPage, LIMIT, () => flattenedData().length, query)

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
