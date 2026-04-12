import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { createTransactionsTableCategoryAssignment } from '@components/transactions/createTransactionsTableCategoryAssignment'
import { createTransactionsTableDerivedData } from '@components/transactions/createTransactionsTableDerivedData'
import PeriodHeader from '@components/transactions/PeriodHeader'
import SummaryStatsCards from '@components/transactions/SummaryStatsCards'
import TransactionsTableAlerts from '@components/transactions/TransactionsTableAlerts'
import TransactionsTableChartsRow from '@components/transactions/TransactionsTableChartsRow'
import TransactionsTableListCard from '@components/transactions/TransactionsTableListCard'
import TransactionsTablePagination from '@components/transactions/TransactionsTablePagination'
import TransactionsTableSelects from '@components/transactions/TransactionsTableSelects'

export default function TransactionsTable() {
  const data = createTransactionsTableDerivedData()
  const cat = createTransactionsTableCategoryAssignment()

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

      <TransactionsTableChartsRow
        firstDay={data.firstDay()}
        chartTimeFrame={data.chartTimeFrame()}
        chartDate={data.chartDate}
      />

      <TransactionsTableSelects dataTestId="transactions-table-selects" />

      <TransactionsTableListCard
        cardTitle={data.cardTitle}
        isLoadingCondition={data.isLoadingCondition}
        paginatedData={data.paginatedData}
        categoryColors={data.categoryColors}
        mutatingTransactionId={cat.mutatingTransactionId}
        openCategoryDialog={cat.openCategoryDialog}
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
    </div>
  )
}
