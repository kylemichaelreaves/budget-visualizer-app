import { useParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal, on } from 'solid-js'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { devConsole } from '@utils/devConsole'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import { syncMemoFromSummaryData } from '@stores/transactionsStore'
import type { MemoPatchFields } from '@types'
import { parseFrequencySelection, recurrenceFields } from '@components/memos/memoRecurrence'
import { computeTotalCredits, computeTotalDebits } from './memoSummaryTableUtils'
import { parsePositiveIntId } from '@utils/parsePositiveIntId'

export function useMemoSummaryTable() {
  const params = useParams<{ memoId: string }>()

  const memoIdNum = createMemo(() => parsePositiveIntId(params.memoId) ?? undefined)

  const memoQ = useMemoById({ memoId: () => memoIdNum() ?? null })
  const summaryQ = useMemoSummary(() => memoIdNum())
  const [txLimit, setTxLimit] = createSignal(50)
  const [txOffset, setTxOffset] = createSignal(0)
  const txQ = useMemoTransactionsPage(() => memoIdNum(), txLimit, txOffset)

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  // Awaits invalidation so the selects stay disabled until they can show the saved value.
  const mutation = mutateMemo({ awaitInvalidation: true })
  const saving = () => mutation.isPending
  const patchError = () => (mutation.error ? extractApiErrorMessage(mutation.error) : null)
  const dismissPatchError = () => mutation.reset()

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
  // Derived from the frequency rather than read from the `recurring` column:
  // the two are kept in lockstep by `recurrenceFields`, and deriving leaves no
  // way for the badge and the dropdown to disagree.
  const isRecurring = () => memo()?.frequency != null
  const isNecessary = () => memo()?.necessary ?? false
  const budgetCategory = () => memo()?.budget_category ?? null
  const frequency = () => memo()?.frequency ?? undefined
  const isResolved = () => !isAmbiguous() && !!budgetCategory()
  const invalidId = () => memoIdNum() == null

  const totalCredits = createMemo(() => computeTotalCredits(summaryQ.data, txQ.data ?? []))
  const totalDebits = createMemo(() => computeTotalDebits(summaryQ.data, txQ.data ?? []))

  function patchMemo(fields: MemoPatchFields) {
    const m = memo()
    if (!m || saving()) return
    mutation.mutate(
      { id: m.id, name: m.name, ...fields },
      { onError: (e) => devConsole('error', 'patchMemo failed', e) },
    )
  }

  function handleCategorySelect(value: string) {
    patchMemo({ budgetCategory: value })
  }

  function handleAmbiguousChange(checked: boolean) {
    patchMemo({ ambiguous: checked })
  }

  function handleNecessaryChange(checked: boolean) {
    patchMemo({ necessary: checked })
  }

  function handleFrequencyChange(value: string) {
    const next = parseFrequencySelection(value)
    // An unrecognised value is ignored rather than written: `recurring` and
    // `frequency` have to move together, and there is no pair to build from it.
    if (next === undefined) return
    patchMemo(recurrenceFields(next))
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
    dismissPatchError,
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
    handleNecessaryChange,
    handleFrequencyChange,
  }
}
