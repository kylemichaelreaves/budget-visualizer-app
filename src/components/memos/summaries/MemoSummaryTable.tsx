import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import MemoSummaryHeader from './MemoSummaryHeader'
import MemoSummaryStatCards from './MemoSummaryStatCards'
import MemoSummaryTransactionsCard from './MemoSummaryTransactionsCard'
import { useMemoSummaryTable } from './useMemoSummaryTable'

export default function MemoSummaryTable(): JSX.Element {
  const state = useMemoSummaryTable()

  return (
    <div class="py-2 text-foreground max-w-5xl mx-auto">
      <Show when={state.invalidId()}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The memo URL must use a numeric memo id."
          dataTestId="memo-summary-invalid-id"
        />
      </Show>

      <Show when={!state.invalidId()}>
        <Show when={state.patchError()}>
          {(msg) => (
            <AlertComponent
              type="error"
              title="Could not save changes"
              message={msg()}
              dataTestId="memo-summary-patch-error"
              close={state.dismissPatchError}
            />
          )}
        </Show>

        <MemoSummaryHeader
          memoId={state.params.memoId}
          memoName={() => state.memo()?.name}
          transactionsCount={() => state.summaryQ.data?.transactions_count}
          isAmbiguous={state.isAmbiguous}
          isResolved={state.isResolved}
          isRecurring={state.isRecurring}
          frequency={state.frequency}
        />

        <ApiErrorAlert
          error={state.memoQ.isError && state.memoQ.error}
          title="Could not load memo"
          dataTestId="memo-summary-memo-error"
        />

        <ApiErrorAlert
          error={state.summaryQ.isError && state.summaryQ.error}
          title="Could not load memo summary"
          dataTestId="memo-summary-stats-error"
        />

        <MemoSummaryStatCards
          totalCredits={state.totalCredits}
          totalDebits={state.totalDebits}
          budgetCategory={state.budgetCategory}
          memoReady={state.memoReady}
          saving={state.saving}
          onOpenCategoryDialog={() => state.setCategoryDialogOpen(true)}
          onAmbiguousChange={state.handleAmbiguousChange}
          onNecessaryChange={state.handleNecessaryChange}
          onFrequencyChange={state.handleFrequencyChange}
          isAmbiguous={state.isAmbiguous}
          isNecessary={state.isNecessary}
          frequency={state.frequency}
        />

        <CategoryTreeSelectDialog
          open={state.categoryDialogOpen()}
          onOpenChange={state.setCategoryDialogOpen}
          value={state.budgetCategory() ?? ''}
          onSelect={state.handleCategorySelect}
          title="Assign Budget Category"
          subtitle={state.memo()?.name}
        />

        <MemoSummaryTransactionsCard
          txIsError={() => state.txQ.isError}
          txError={() => state.txQ.error}
          txIsLoading={() => state.txQ.isLoading}
          txIsFetching={() => state.txQ.isFetching}
          txRows={() => state.txQ.data}
          summaryTransactionsCount={() => state.summaryQ.data?.transactions_count}
          txLimit={state.txLimit}
          setTxLimit={state.setTxLimit}
          txOffset={state.txOffset}
          setTxOffset={state.setTxOffset}
          canPrev={state.canPrev}
          canNext={state.canNext}
          goPrevTx={state.goPrevTx}
          goNextTx={state.goNextTx}
        />
      </Show>
    </div>
  )
}
