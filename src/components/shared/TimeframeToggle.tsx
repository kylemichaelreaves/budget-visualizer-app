import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import './shared-ui.css'

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
    <div class="bv-timeframe-toggle" role="group" aria-label="Timeframe">
      <For each={opts()}>
        {(option) => (
          <button
            type="button"
            class="bv-check-tag"
            classList={{ 'bv-check-tag-checked': props.value === option.value }}
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
