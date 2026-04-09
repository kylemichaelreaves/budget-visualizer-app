import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { clearAllFilters, transactionsState } from '@stores/transactionsStore'

const selectBase = 'p-2 rounded border bg-background text-foreground'
const activeBorder = 'border-brand'
const inactiveBorder = 'border-input'

export default function TimeframeSelect(props: {
  label: string
  dataTestId: string
  viewMode: string
  value: string
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  isError?: boolean
}): JSX.Element {
  const classes = () =>
    `${selectBase} ${transactionsState.viewMode === props.viewMode ? activeBorder : inactiveBorder}`

  return (
    <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
      {props.label}
      <select
        data-testid={props.dataTestId}
        value={props.value}
        onChange={(e) => {
          const v = e.currentTarget.value
          if (v) props.onSelect(v)
          else clearAllFilters()
        }}
        class={classes()}
      >
        <option value="">Any</option>
        <For each={props.options}>{(o) => <option value={o.value}>{o.label}</option>}</For>
      </select>
      <Show when={props.isError}>
        <span class="text-destructive text-[10px]">Failed to load</span>
      </Show>
    </label>
  )
}
