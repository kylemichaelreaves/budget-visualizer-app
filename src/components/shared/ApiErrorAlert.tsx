import { Show } from 'solid-js'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import AlertComponent from '@components/shared/AlertComponent'

/**
 * The one way to show a failed request or mutation. The caller names what failed
 * (`title`); the body is the server's own `message` when there is one, otherwise the
 * error's. Never title an alert with `error.name`: for a 4xx that reads "AxiosError".
 *
 * Renders nothing while `error` is falsy, so `error={query.isError && query.error}`
 * is enough.
 */
export default function ApiErrorAlert(props: {
  error: unknown
  title: string
  dataTestId?: string
  close?: () => void
}) {
  return (
    <Show when={props.error}>
      {(err) => (
        <AlertComponent
          type="error"
          title={props.title}
          message={extractApiErrorMessage(err())}
          dataTestId={props.dataTestId}
          close={props.close}
        />
      )}
    </Show>
  )
}
