import { For } from 'solid-js'
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group'
import { OBSERVABILITY_RANGES } from '@components/observability/helpers/observabilityRange'
import type { ObservabilityRange } from '@types'

export default function RangeToggle(props: {
  value: ObservabilityRange
  onChange: (range: ObservabilityRange) => void
}) {
  return (
    <ToggleGroup
      variant="outline"
      aria-label="Time range"
      value={props.value}
      onChange={(next) => {
        // Kobalte reports null when the pressed item is clicked again; keep the range.
        if (next) props.onChange(next as ObservabilityRange)
      }}
    >
      <For each={OBSERVABILITY_RANGES}>
        {(range) => (
          <ToggleGroupItem value={range} data-testid={`observability-range-${range}`} class="px-3">
            {range}
          </ToggleGroupItem>
        )}
      </For>
    </ToggleGroup>
  )
}
