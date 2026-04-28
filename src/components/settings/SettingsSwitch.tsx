import { cn } from '@utils/cn'

export function SettingsSwitch(props: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      id={props.id}
      type="button"
      role="switch"
      aria-checked={props.checked}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
      class={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        props.checked ? 'bg-primary' : 'bg-muted',
        props.disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <span
        class={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          props.checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
