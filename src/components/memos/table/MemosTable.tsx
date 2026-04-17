import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { createBudgetCategorySummaryTimeframeFromStore } from '@composables/budgetCategorySummaryTimeframeFromStore'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { createMemosTableDerivedData } from '@components/memos/table/createMemosTableDerivedData'
import { createMemosTableMutations } from '@components/memos/table/createMemosTableMutations'
import MemosTableAlerts from '@components/memos/table/MemosTableAlerts'
import MemosTableListCard from '@components/memos/table/MemosTableListCard'
import MemosTablePageIntro from '@components/memos/table/MemosTablePageIntro'
import MemosTablePagination from '@components/memos/table/MemosTablePagination'
import type { BudgetCategorySummary } from '@types'

export default function MemosTable(): JSX.Element {
  const data = createMemosTableDerivedData()
  const mutations = createMemosTableMutations()

  const { chartTimeFrame, chartDate } = createBudgetCategorySummaryTimeframeFromStore(() => undefined)
  const categorySummaryQuery = useBudgetCategorySummary(
    () => chartTimeFrame(),
    () => chartDate(),
  )
  const categoryColors = createMemo(() =>
    budgetCategoryColorsFromData(categorySummaryQuery.data as BudgetCategorySummary[] | undefined),
  )

  return (
    <>
      <MemosTableAlerts
        queryIsError={() => data.query.isError}
        queryError={() => data.query.error}
        tableMutationError={mutations.tableMutationError}
        onDismissMutationError={() => mutations.setTableMutationError(null)}
      />

      <MemosTablePageIntro
        headerUniqueTotal={data.headerUniqueTotal}
        headerAmbiguousCount={data.headerAmbiguousCount}
        headerAmbiguousPartial={data.headerAmbiguousPartial}
        searchIsActive={() => !!data.searchQuery().trim()}
      />

      <MemosTableListCard
        searchQuery={data.searchQuery}
        setSearchQuery={data.setSearchQuery}
        isLoadingCondition={data.isLoadingCondition}
        limit={data.LIMIT}
        paginatedData={data.paginatedData}
        sortKey={data.sortKey}
        sortDir={data.sortDir}
        onSort={data.handleSort}
        togglingAmbiguousId={mutations.togglingAmbiguousId}
        mutatingCategoryId={mutations.mutatingCategoryId}
        onToggleAmbiguous={mutations.toggleAmbiguous}
        onAssignCategory={mutations.handleAssignCategory}
        getColorByName={(name) => categoryColors().getColorByName(name)}
      />

      <MemosTablePagination
        clientFilteredTotal={() => (data.searchQuery().trim() ? data.totalMemos() : undefined)}
      />

      <CategoryTreeSelectDialog
        open={mutations.categoryDialogOpen()}
        onOpenChange={mutations.setCategoryDialogOpen}
        value={mutations.categoryDialogTarget()?.budget_category ?? ''}
        onSelect={mutations.handleCategorySelect}
        subtitle={mutations.categoryDialogTarget()?.name}
      />
    </>
  )
}
