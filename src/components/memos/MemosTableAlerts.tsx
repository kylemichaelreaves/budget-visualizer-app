import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'

export default function MemosTableAlerts(props: {
  queryIsError: Accessor<boolean>
  queryError: Accessor<unknown>
  tableMutationError: Accessor<string | null>
  onDismissMutationError: () => void
}) {
  return (
    <>
      <Show when={props.queryIsError() && props.queryError()}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="memos-table-error-alert"
          />
        )}
      </Show>

      <Show when={props.tableMutationError()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Update failed"
            message={msg()}
            dataTestId="memos-table-mutation-error"
            close={props.onDismissMutationError}
          />
        )}
      </Show>
    </>
  )
}
