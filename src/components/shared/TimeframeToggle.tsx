import type { JSX } from 'solid-js'
import { For } from 'solid-js'

const defaultOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

export default function TimeframeToggle(props: {
  value: string
  onChange: (value: string) => void
  options?: { label: string; value: string }[]
}): JSX.Element {
  const opts = () => props.options ?? defaultOptions

  return (
    <div class="flex flex-wrap gap-2" role="group" aria-label="Timeframe">
      <For each={opts()}>
        {(option) => (
          <button
            type="button"
            class="cursor-pointer rounded-md border px-3.5 py-1.5 text-sm transition-colors"
            classList={{
              'bg-primary !text-primary-foreground border-primary font-semibold': props.value === option.value,
              'bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground':
                props.value !== option.value,
            }}
            onClick={() => {
              if (props.value !== option.value) {
                props.onChange(option.value)
              }
            }}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  )
}
