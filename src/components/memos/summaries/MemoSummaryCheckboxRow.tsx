import type { JSX } from 'solid-js'

export default function MemoSummaryCheckboxRow(props: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
  accentClass: string
  trailing?: JSX.Element
}) {
  return (
    <label
      class="flex items-center gap-2 text-sm"
      classList={{
        'cursor-pointer': !props.disabled,
        'cursor-not-allowed opacity-60': props.disabled,
      }}
    >
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
        class={`rounded border-border ${props.accentClass}`}
      />
      <span>{props.label}</span>
      {props.trailing}
    </label>
  )
}
