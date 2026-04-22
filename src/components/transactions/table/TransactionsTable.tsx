import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import SplitBudgetCategoryDrawer from '@components/transactions/forms/SplitBudgetCategoryDrawer'
import MonthSummaryTable from '@components/transactions/summaries/MonthSummaryTable'
import PeriodHeader from '@components/transactions/summaries/PeriodHeader'
import SummaryStatsCards from '@components/transactions/summaries/SummaryStatsCards'
import WeekSummaryTable from '@components/transactions/summaries/WeekSummaryTable'
import { createTransactionsTableCategoryAssignment } from '@components/transactions/table/createTransactionsTableCategoryAssignment'
import { createTransactionsTableDerivedData } from '@components/transactions/table/createTransactionsTableDerivedData'
import { createTransactionsTableSplitDrawer } from '@components/transactions/table/createTransactionsTableSplitDrawer'
import TransactionsTableAlerts from '@components/transactions/table/TransactionsTableAlerts'
import TransactionsTableChartsRow from '@components/transactions/table/TransactionsTableChartsRow'
import TransactionsTableListCard from '@components/transactions/table/TransactionsTableListCard'
import TransactionsTablePagination from '@components/transactions/table/TransactionsTablePagination'
import TransactionsTableSelects from '@components/transactions/table/TransactionsTableSelects'
import type { SplitBudgetCategory } from '@types'

export default function TransactionsTable() {
  const data = createTransactionsTableDerivedData()
  const cat = createTransactionsTableCategoryAssignment()
  const split = createTransactionsTableSplitDrawer()

  const splitTarget = () => split.target()
  const targetBudgetCategory = () => {
    const bc = splitTarget()?.budget_category
    return Array.isArray(bc) ? (bc as SplitBudgetCategory[]) : []
  }
  const targetAmount = () => {
    const t = splitTarget()
    if (!t) return 0
    const debit = Number(t.amount_debit)
    const credit = Number(t.amount_credit)
    return Math.abs(Number.isFinite(debit) && debit !== 0 ? debit : credit)
  }
  const targetType = () => {
    const t = splitTarget()
    if (!t) return 'debit' as const
    const credit = Number(t.amount_credit)
    return Number.isFinite(credit) && credit > 0 ? ('credit' as const) : ('debit' as const)
  }
  const targetCategoryLabel = () => {
    const bc = splitTarget()?.budget_category
    return typeof bc === 'string' ? bc : undefined
  }

  return (
    <div class="space-y-6">
      <TransactionsTableAlerts
        queryIsError={() => data.query.isError}
        queryError={() => data.query.error}
        categoryAssignError={cat.categoryAssignError}
        onDismissCategoryError={() => cat.setCategoryAssignError(null)}
      />

      <PeriodHeader />

      <SummaryStatsCards transactions={data.paginatedData()} />

      <MonthSummaryTable />
      <WeekSummaryTable />

      <TransactionsTableChartsRow
        firstDay={data.firstDay()}
        chartTimeFrame={data.chartTimeFrame()}
        chartDate={data.chartDate}
        categoryColors={data.categoryColors}
      />

      <TransactionsTableSelects dataTestId="transactions-table-selects" />

      <TransactionsTableListCard
        cardTitle={data.cardTitle}
        isLoadingCondition={data.isLoadingCondition}
        paginatedData={data.paginatedData}
        categoryColors={data.categoryColors}
        mutatingTransactionId={cat.mutatingTransactionId}
        openCategoryDialog={cat.openCategoryDialog}
        openSplitDrawer={split.openSplitDrawer}
      />

      <TransactionsTablePagination />

      <CategoryTreeSelectDialog
        open={cat.categoryDialogOpen()}
        onOpenChange={cat.setCategoryDialogOpen}
        value={
          typeof cat.categoryDialogTarget()?.budget_category === 'string'
            ? (cat.categoryDialogTarget()!.budget_category as string)
            : ''
        }
        onSelect={cat.handleCategorySelect}
        subtitle={cat.categoryDialogTarget()?.memo || cat.categoryDialogTarget()?.description || undefined}
      />

      <SplitBudgetCategoryDrawer
        open={split.open() && splitTarget() != null}
        splits={targetBudgetCategory()}
        transactionAmount={targetAmount()}
        transactionType={targetType()}
        transactionDescription={splitTarget()?.description || splitTarget()?.memo || undefined}
        transactionDate={splitTarget()?.date}
        transactionCategory={targetCategoryLabel()}
        timeframe={() => data.chartTimeFrame()}
        date={() => data.chartDate()}
        onSubmit={split.handleSubmit}
        onCancel={split.closeSplitDrawer}
        onClear={split.handleClear}
      />
    </div>
  )
}
