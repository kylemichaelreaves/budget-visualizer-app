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
        {(err) => {
          const e = err() as unknown
          const error = e instanceof Error ? e : new Error(String(e))
          return (
            <AlertComponent
              type="error"
              title={error.name}
              message={error.message}
              dataTestId="memos-table-error-alert"
            />
          )
        }}
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
