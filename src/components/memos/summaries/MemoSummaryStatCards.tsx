import type { Accessor } from 'solid-js'
import MemoSummaryStatCard from './MemoSummaryStatCard'
import MemoSummaryStatCardBudget from './MemoSummaryStatCardBudget'
import type { MemoSummaryCreditAggregate, MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'

export default function MemoSummaryStatCards(props: {
  totalCredits: Accessor<MemoSummaryCreditAggregate>
  totalDebits: Accessor<MemoSummaryDebitAggregate>
  budgetCategory: Accessor<string | null>
  memoReady: Accessor<boolean>
  saving: Accessor<boolean>
  onOpenCategoryDialog: () => void
  onAmbiguousChange: (checked: boolean) => void
  onRecurringChange: (checked: boolean) => void
  onNecessaryChange: (checked: boolean) => void
  onFrequencyChange: (value: string) => void
  isAmbiguous: Accessor<boolean>
  isRecurring: Accessor<boolean>
  isNecessary: Accessor<boolean>
  frequency: Accessor<string | undefined>
}) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <MemoSummaryStatCard mode="credit" totalCredits={props.totalCredits} />
      <MemoSummaryStatCard mode="debit" totalDebits={props.totalDebits} />
      <MemoSummaryStatCardBudget
        budgetCategory={props.budgetCategory}
        memoReady={props.memoReady}
        saving={props.saving}
        onOpenCategoryDialog={props.onOpenCategoryDialog}
        onAmbiguousChange={props.onAmbiguousChange}
        onRecurringChange={props.onRecurringChange}
        onNecessaryChange={props.onNecessaryChange}
        onFrequencyChange={props.onFrequencyChange}
        isAmbiguous={props.isAmbiguous}
        isRecurring={props.isRecurring}
        isNecessary={props.isNecessary}
        frequency={props.frequency}
      />
    </div>
  )
}
