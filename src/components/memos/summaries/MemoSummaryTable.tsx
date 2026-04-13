import { useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, Show } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import { devConsole } from '@utils/devConsole'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useMemoSummary from '@api/hooks/memos/useMemoSummary'
import useMemoTransactionsPage from '@api/hooks/memos/useMemoTransactionsPage'
import AlertComponent from '@components/shared/AlertComponent'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { MEMO_SUMMARY_FREQUENCY_OPTIONS } from './memoSummaryConstants'
import MemoSummaryHeader from './MemoSummaryHeader'
import MemoSummaryStatCards from './MemoSummaryStatCards'
import MemoSummaryTransactionsCard from './MemoSummaryTransactionsCard'
import { syncMemoFromSummaryData } from '@stores/transactionsStore'
import type { Frequency, MemoPatchFields } from '@types'

export default function MemoSummaryTable(): JSX.Element {
  const params = useParams<{ memoId: string }>()
  const queryClient = useQueryClient()

  const memoIdNum = createMemo(() => {
    const n = Number(params.memoId)
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined
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
    const rows = txQ.data?.length ?? 0
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

  const totalCredits = createMemo(() => {
    const s = summaryQ.data
    const apiCredit = s?.sum_amount_credit
    if (apiCredit != null && Number.isFinite(apiCredit)) {
      return { sum: apiCredit, creditTxnCount: null as number | null, aggregateScope: 'memo' as const }
    }
    const txns = txQ.data ?? []
    let sum = 0
    let count = 0
    for (const tx of txns) {
      const credit =
        typeof tx.amount_credit === 'string'
          ? parseFloat(tx.amount_credit)
          : ((tx.amount_credit as unknown as number) ?? 0)
      if (credit > 0) {
        sum += credit
        count++
      }
    }
    return { sum, creditTxnCount: count, aggregateScope: 'page' as const }
  })

  const totalDebits = createMemo(() => {
    const s = summaryQ.data
    const apiDebit = s?.sum_amount_debit
    if (apiDebit != null && Number.isFinite(apiDebit)) {
      return { sum: apiDebit, debitTxnCount: null as number | null, aggregateScope: 'memo' as const }
    }
    const txns = txQ.data ?? []
    let sum = 0
    let count = 0
    for (const tx of txns) {
      const debit =
        typeof tx.amount_debit === 'string'
          ? parseFloat(tx.amount_debit)
          : ((tx.amount_debit as unknown as number) ?? 0)
      if (debit > 0) {
        sum += debit
        count++
      }
    }
    return { sum, debitTxnCount: count, aggregateScope: 'page' as const }
  })

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

  const invalidId = () => memoIdNum() == null

  return (
    <div class="py-2 text-foreground max-w-5xl mx-auto">
      <Show when={invalidId()}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The memo URL must use a numeric memo id."
          dataTestId="memo-summary-invalid-id"
        />
      </Show>

      <Show when={!invalidId()}>
        <Show when={patchError()}>
          {(msg) => (
            <AlertComponent
              type="error"
              title="Could not save changes"
              message={msg()}
              dataTestId="memo-summary-patch-error"
              close={() => setPatchError(null)}
            />
          )}
        </Show>

        <MemoSummaryHeader
          memoId={params.memoId}
          memoName={() => memo()?.name}
          transactionsCount={() => summaryQ.data?.transactions_count}
          isAmbiguous={isAmbiguous}
          isResolved={isResolved}
          isRecurring={isRecurring}
          frequency={frequency}
        />

        <Show when={memoQ.isError && memoQ.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId="memo-summary-memo-error"
            />
          )}
        </Show>

        <Show when={summaryQ.isError && summaryQ.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId="memo-summary-stats-error"
            />
          )}
        </Show>

        <MemoSummaryStatCards
          totalCredits={totalCredits}
          totalDebits={totalDebits}
          budgetCategory={budgetCategory}
          memoReady={memoReady}
          saving={saving}
          onOpenCategoryDialog={() => setCategoryDialogOpen(true)}
          onAmbiguousChange={handleAmbiguousChange}
          onRecurringChange={handleRecurringChange}
          onNecessaryChange={handleNecessaryChange}
          onFrequencyChange={handleFrequencyChange}
          isAmbiguous={isAmbiguous}
          isRecurring={isRecurring}
          isNecessary={isNecessary}
          frequency={frequency}
        />

        <CategoryTreeSelectDialog
          open={categoryDialogOpen()}
          onOpenChange={setCategoryDialogOpen}
          value={budgetCategory() ?? ''}
          onSelect={handleCategorySelect}
          title="Assign Budget Category"
          subtitle={memo()?.name}
        />

        <MemoSummaryTransactionsCard
          txIsError={() => txQ.isError}
          txError={() => txQ.error}
          txIsLoading={() => txQ.isLoading}
          txIsFetching={() => txQ.isFetching}
          txRows={() => txQ.data}
          summaryTransactionsCount={() => summaryQ.data?.transactions_count}
          txLimit={txLimit}
          setTxLimit={setTxLimit}
          txOffset={txOffset}
          setTxOffset={setTxOffset}
          canPrev={canPrev}
          canNext={canNext}
          goPrevTx={goPrevTx}
          goNextTx={goNextTx}
        />
      </Show>
    </div>
  )
}
