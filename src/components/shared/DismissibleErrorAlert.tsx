import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'

export default function DismissibleErrorAlert(props: {
  message: Accessor<string | null>
  title: string
  dataTestId: string
  onDismiss: () => void
}) {
  return (
    <Show when={props.message()}>
      {(msg) => (
        <AlertComponent
          type="error"
          title={props.title}
          message={msg()}
          dataTestId={props.dataTestId}
          close={props.onDismiss}
        />
      )}
    </Show>
  )
}
