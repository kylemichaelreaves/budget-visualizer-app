import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert'

export type AlertType = 'success' | 'warning' | 'info' | 'error'

const borderColorMap: Record<AlertType, string> = {
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  info: 'border-l-4 border-l-info',
  error: 'border-l-4 border-l-destructive',
}

export default function AlertComponent(props: {
  type: AlertType
  title: string
  message: string
  close?: () => void
  dataTestId?: string
}): JSX.Element {
  const id = () => props.dataTestId ?? 'alert'

  return (
    <Alert
      variant={props.type === 'error' ? 'destructive' : 'default'}
      class={`relative my-2 ${borderColorMap[props.type]}`}
      data-testid={id()}
    >
      <Show when={props.close}>
        {(onClose) => (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => onClose()()}
            class="absolute right-2 top-2 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer text-lg leading-none p-1"
          >
            ×
          </button>
        )}
      </Show>
      <AlertTitle data-testid={`${id()}-title`}>{props.title}</AlertTitle>
      <AlertDescription data-testid={`${id()}-message`}>{props.message}</AlertDescription>
    </Alert>
  )
}
