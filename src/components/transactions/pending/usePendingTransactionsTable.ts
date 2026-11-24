import { createEffect, createMemo, createSignal } from 'solid-js'
import usePendingTransactions from '@api/hooks/transactions/usePendingTransactions'
import { fetchInfinitePagesUntilCount } from '@composables/infiniteQueryPagePrefetch'
import { rowsForPage } from '@components/transactions/table/transactionsTablePageWindow'
import { setSelectedStatus, transactionsState, updatePendingTableOffset } from '@stores/transactionsStore'
import type { PendingTransaction, PendingTransactionStatus, Transaction } from '@types'
import { parseRow } from './pendingTransactionsTableUtils'
import { settledData } from '@api/helpers/settledData'
import { queryFlag } from '@api/helpers/queryFlag'

export function usePendingTransactionsTable() {
  const query = usePendingTransactions()
  const [modalOpen, setModalOpen] = createSignal(false)
  const [editTxn, setEditTxn] = createSignal<Transaction | null>(null)
  const [pendingId, setPendingId] = createSignal<number | undefined>()

  const viewMode = () => transactionsState.selectedStatus
  const setViewMode = (v: PendingTransactionStatus) => {
    setSelectedStatus(v)
  }

  createEffect(
    () => transactionsState.selectedStatus,
    () => {
      updatePendingTableOffset(0)
    },
  )

  // Same rule as the transactions table: a background refetch keeps the rows on screen.
  const isInitialLoading = () =>
    queryFlag(query, 'isLoading') || (queryFlag(query, 'isFetching') && !settledData(query)?.pages?.length)
  const isLoadingCondition = () =>
    isInitialLoading() || queryFlag(query, 'isFetchingNextPage') || queryFlag(query, 'isFetchingPreviousPage')

  /** Pages exactly as the server returned them, in offset order. */
  const loadedPages = createMemo(() => settledData(query)?.pages ?? [])

  const LIMIT = () => transactionsState.transactionsTableLimit

  const currentPage = () => Math.floor(transactionsState.pendingTableOffset / LIMIT()) + 1

  // Render the page the server returned for this offset — the same rule as the
  // main table (see `createTransactionsTableDerivedData`), so the rows and the
  // pager's server count can't drift apart.
  const paginatedData = createMemo(() => rowsForPage(loadedPages(), currentPage()))

  // The query only appends, so reaching page N means fetching pages 1..N.
  createEffect(currentPage, (page) => {
    void fetchInfinitePagesUntilCount(query, {
      currentCount: () => loadedPages().length,
      requiredCount: page,
    })
  })

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
