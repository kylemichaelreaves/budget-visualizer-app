import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'

/** Coerces TanStack / unknown errors and renders a destructive {@link AlertComponent}. */
export default function QueryErrorAlert(props: {
  isError: Accessor<boolean>
  error: Accessor<unknown>
  dataTestId: string
}) {
  return (
    <Show when={props.isError() && props.error()}>
      {(err) => {
        const e = err() as unknown
        const error = e instanceof Error ? e : new Error(String(e))
        return (
          <AlertComponent
            type="error"
            title={error.name}
            message={error.message}
            dataTestId={props.dataTestId}
          />
        )
      }}
    </Show>
  )
}
