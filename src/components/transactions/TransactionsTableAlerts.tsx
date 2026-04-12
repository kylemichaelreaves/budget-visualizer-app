import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'

export default function TransactionsTableAlerts(props: {
  queryError: Accessor<unknown>
  queryIsError: Accessor<boolean>
  categoryAssignError: Accessor<string | null>
  onDismissCategoryError: () => void
}) {
  return (
    <>
      <Show when={() => (props.queryIsError() ? props.queryError() : false)}>
        {(err) => {
          const e = err() as unknown
          const error = e instanceof Error ? e : new Error(String(e))
          return (
            <AlertComponent
              type="error"
              title={error.name}
              message={error.message}
              dataTestId="transactions-table-error-alert"
            />
          )
        }}
      </Show>

      <Show when={props.categoryAssignError()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Could not assign category"
            message={msg()}
            dataTestId="transactions-table-category-assign-error"
            close={props.onDismissCategoryError}
          />
        )}
      </Show>
    </>
  )
}
