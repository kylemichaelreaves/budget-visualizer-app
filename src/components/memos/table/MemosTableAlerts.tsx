import type { Accessor } from 'solid-js'
import DismissibleErrorAlert from '@components/shared/DismissibleErrorAlert'
import QueryErrorAlert from '@components/shared/QueryErrorAlert'

export default function MemosTableAlerts(props: {
  queryIsError: Accessor<boolean>
  queryError: Accessor<unknown>
  tableMutationError: Accessor<string | null>
  onDismissMutationError: () => void
}) {
  return (
    <>
      <QueryErrorAlert
        isError={props.queryIsError}
        error={props.queryError}
        dataTestId="memos-table-error-alert"
      />

      <DismissibleErrorAlert
        message={props.tableMutationError}
        title="Update failed"
        dataTestId="memos-table-mutation-error"
        onDismiss={props.onDismissMutationError}
      />
    </>
  )
}
