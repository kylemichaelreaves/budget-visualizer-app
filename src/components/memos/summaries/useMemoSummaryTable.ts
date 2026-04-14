import { useParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal, on } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import { devConsole } from '@utils/devConsole'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import { syncMemoFromSummaryData } from '@stores/transactionsStore'
import type { Frequency, MemoPatchFields } from '@types'
import { MEMO_SUMMARY_FREQUENCY_OPTIONS } from './memoSummaryConstants'
import { computeTotalCredits, computeTotalDebits } from './memoSummaryTableUtils'

export function useMemoSummaryTable() {
  const params = useParams<{ memoId: string }>()
  const queryClient = useQueryClient()

  const memoIdNum = createMemo(() => {
    const n = Number(params.memoId)
    return Number.isFinite(n) && n > 0 ? n : undefined
  })

  const memoQ = useMemoById({ memoId: () => memoIdNum() ?? null })
  const summaryQ = useMemoSummary(() => memoIdNum())
  const [txLimit, setTxLimit] = createSignal(50)
  const [txOffset, setTxOffset] = createSignal(0)
  const txQ = useMemoTransactionsPage(() => memoIdNum(), txLimit, txOffset)

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [patchError, setPatchError] = createSignal<string | null>(null)

  createEffect(
    on(
      () => memoQ.data,
      (memo) => {
        if (memo?.name) syncMemoFromSummaryData(memo.name, memo.id)
      },
      { defer: true },
    ),
  )

  const canPrev = () => txOffset() > 0
  const canNext = () => {
    if (txQ.isLoading || txQ.isFetching) return false
    const rows = txQ.data?.length ?? 0
    if (rows === 0) return false
    const cap = summaryQ.data?.transactions_count
    if (cap != null) {
      return txOffset() + rows < cap
    }
    return rows >= txLimit()
  }

  function goPrevTx() {
    if (!canPrev()) return
    setTxOffset(Math.max(0, txOffset() - txLimit()))
  }

  function goNextTx() {
    if (!canNext()) return
    setTxOffset(txOffset() + txLimit())
  }

  const memo = () => memoQ.data
  const memoReady = createMemo(() => !!memoQ.data)
  const isAmbiguous = () => memo()?.ambiguous ?? false
  const isRecurring = () => memo()?.recurring ?? false
  const isNecessary = () => memo()?.necessary ?? false
  const budgetCategory = () => memo()?.budget_category ?? null
  const frequency = () => memo()?.frequency ?? undefined
  const isResolved = () => !isAmbiguous() && !!budgetCategory()
  const invalidId = () => memoIdNum() == null

  const totalCredits = createMemo(() => computeTotalCredits(summaryQ.data, txQ.data ?? []))
  const totalDebits = createMemo(() => computeTotalDebits(summaryQ.data, txQ.data ?? []))

  async function patchMemo(fields: MemoPatchFields) {
    const m = memo()
    if (!m) return
    setPatchError(null)
    setSaving(true)
    try {
      await updateMemo({ id: m.id, name: m.name, ...fields })
      await invalidateAfterMemoMutation(queryClient)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      setPatchError(msg)
      devConsole('error', 'patchMemo failed', e)
    } finally {
      setSaving(false)
    }
  }

  function handleCategorySelect(value: string) {
    patchMemo({ budgetCategory: value })
  }

  function handleAmbiguousChange(checked: boolean) {
    patchMemo({ ambiguous: checked })
  }

  function handleRecurringChange(checked: boolean) {
    patchMemo({ recurring: checked, ...(checked ? {} : { frequency: null }) })
  }

  function handleNecessaryChange(checked: boolean) {
    patchMemo({ necessary: checked })
  }

  function handleFrequencyChange(value: string) {
    const v = value.trim()
    if (!v) {
      patchMemo({ frequency: null, recurring: true })
      return
    }
    if (MEMO_SUMMARY_FREQUENCY_OPTIONS.includes(v as Frequency)) {
      patchMemo({ frequency: v as Frequency, recurring: true })
    }
  }

  return {
    params,
    memoQ,
    summaryQ,
    txQ,
    txLimit,
    setTxLimit,
    txOffset,
    setTxOffset,
    categoryDialogOpen,
    setCategoryDialogOpen,
    saving,
    patchError,
    setPatchError,
    canPrev,
    canNext,
    goPrevTx,
    goNextTx,
    memo,
    memoReady,
    isAmbiguous,
    isRecurring,
    isNecessary,
    budgetCategory,
    frequency,
    isResolved,
    invalidId,
    totalCredits,
    totalDebits,
    handleCategorySelect,
    handleAmbiguousChange,
    handleRecurringChange,
    handleNecessaryChange,
    handleFrequencyChange,
  }
}
