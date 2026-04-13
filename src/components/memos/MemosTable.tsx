import type { JSX } from 'solid-js'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { createMemosTableDerivedData } from '@components/memos/createMemosTableDerivedData'
import { createMemosTableMutations } from '@components/memos/createMemosTableMutations'
import MemosTableAlerts from '@components/memos/MemosTableAlerts'
import MemosTableListCard from '@components/memos/MemosTableListCard'
import MemosTablePageIntro from '@components/memos/MemosTablePageIntro'
import MemosTablePagination from '@components/memos/MemosTablePagination'

export default function MemosTable(): JSX.Element {
  const data = createMemosTableDerivedData()
  const mutations = createMemosTableMutations()

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
