import type { Accessor } from 'solid-js'
import QueryErrorAlert, { DismissibleErrorAlert } from '@components/shared/QueryErrorAlert'

export default function TransactionsTableAlerts(props: {
  queryError: Accessor<unknown>
  queryIsError: Accessor<boolean>
  categoryAssignError: Accessor<string | null>
  onDismissCategoryError: () => void
}) {
  return (
    <>
      <QueryErrorAlert
        isError={props.queryIsError}
        error={props.queryError}
        dataTestId="transactions-table-error-alert"
      />

      <DismissibleErrorAlert
        message={props.categoryAssignError}
        title="Could not assign category"
        dataTestId="transactions-table-category-assign-error"
        onDismiss={props.onDismissCategoryError}
      />
    </>
  )
}
