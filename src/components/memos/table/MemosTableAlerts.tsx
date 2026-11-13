import type { Accessor } from 'solid-js'
import DismissibleErrorAlert from '@components/shared/DismissibleErrorAlert'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'

export default function MemosTableAlerts(props: {
  queryIsError: Accessor<boolean>
  queryError: Accessor<unknown>
  tableMutationError: Accessor<string | null>
  onDismissMutationError: () => void
}) {
  return (
    <>
      <ApiErrorAlert
        error={props.queryIsError() && props.queryError()}
        title="Could not load memos"
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
