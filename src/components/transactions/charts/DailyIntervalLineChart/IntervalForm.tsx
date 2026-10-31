import type { JSX } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import { Label } from '@components/ui/label'
import { Input } from '@components/ui/input'
import { useIsIntervalGreaterThanOldestDate } from '@api/hooks/transactions/useIsIntervalGreaterThanOldestDate'
import {
  clampIntervalCount,
  MAX_INTERVAL_COUNT,
  MIN_INTERVAL_COUNT,
} from '@components/transactions/helpers/clampIntervalCount'

// Must be one of the <option> values below; a value with no matching option leaves the select blank.
const DEFAULT_UNIT = 'months'

export default function IntervalForm(props: {
  dataTestId?: string
  onIntervalValueChange: (v: string) => void
}): JSX.Element {
  const [intervalSelect, setIntervalSelect] = createSignal(DEFAULT_UNIT)
  const [numberInput, setNumberInput] = createSignal(MIN_INTERVAL_COUNT)

  const computedInterval = () => `${numberInput()} ${intervalSelect()}`

  createEffect(() => {
    props.onIntervalValueChange(computedInterval())
  })

  const intervalQuery = useIsIntervalGreaterThanOldestDate(computedInterval)

  const isOutOfRange = () => intervalQuery.data?.[0]?.is_out_of_range === true

  const onClose = () => {
    setIntervalSelect(DEFAULT_UNIT)
    setNumberInput(MIN_INTERVAL_COUNT)
  }

  return (
    <div data-testid={props.dataTestId}>
      {isOutOfRange() ? (
        <AlertComponent
          type="error"
          title="Interval Exceeds Oldest Transaction"
          message="Your requested interval exceeds the oldest dated transaction. Please choose a smaller interval."
          close={onClose}
        />
      ) : null}
      {intervalQuery.isError && intervalQuery.error ? (
        <AlertComponent
          type="error"
          title={(intervalQuery.error as Error).name}
          message={(intervalQuery.error as Error).message}
        />
      ) : null}
      <div
        class="flex items-center justify-end gap-2"
        classList={{ 'opacity-50': isOutOfRange(), 'pointer-events-none': isOutOfRange() }}
      >
        <Label class="flex items-center gap-1.5 text-xs text-muted-foreground">
          Count
          <Input
            type="number"
            min={MIN_INTERVAL_COUNT}
            max={MAX_INTERVAL_COUNT}
            step={1}
            value={numberInput()}
            data-testid="interval-input-number"
            onInput={(e) => setNumberInput(clampIntervalCount(e.currentTarget.value))}
            class="w-14 h-7 px-2 text-xs"
          />
        </Label>
        <Label class="flex items-center gap-1.5 text-xs text-muted-foreground">
          Interval
          <select
            data-testid="interval-select"
            value={intervalSelect()}
            onChange={(e) => setIntervalSelect(e.currentTarget.value)}
            class="h-7 rounded-md border border-input bg-input-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="days">{numberInput() === 1 ? 'Day' : 'Days'}</option>
            <option value="weeks">{numberInput() === 1 ? 'Week' : 'Weeks'}</option>
            <option value="months">{numberInput() === 1 ? 'Month' : 'Months'}</option>
            <option value="years">{numberInput() === 1 ? 'Year' : 'Years'}</option>
          </select>
        </Label>
      </div>
    </div>
  )
}
