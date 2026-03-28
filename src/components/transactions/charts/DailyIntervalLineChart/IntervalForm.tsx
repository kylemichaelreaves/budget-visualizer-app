import type { JSX } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import { Label } from '@components/ui/label'
import { Input } from '@components/ui/input'
import { useIsIntervalGreaterThanOldestDate } from '@api/hooks/transactions/useIsIntervalGreaterThanOldestDate'

export default function IntervalForm(props: {
  dataTestId?: string
  onIntervalValueChange: (v: string) => void
}): JSX.Element {
  const [intervalSelect, setIntervalSelect] = createSignal('month')
  const [numberInput, setNumberInput] = createSignal(1)

  const computedInterval = () => `${numberInput()} ${intervalSelect()}`

  createEffect(() => {
    props.onIntervalValueChange(computedInterval())
  })

  const intervalQuery = useIsIntervalGreaterThanOldestDate(computedInterval)

  const isOutOfRange = () => {
    const d = intervalQuery.data
    if (Array.isArray(d)) return d[0]?.is_out_of_range === true
    return d === true
  }

  const onClose = () => {
    setIntervalSelect('month')
    setNumberInput(1)
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
        classList={{ 'opacity-50 pointer-events-none': isOutOfRange() }}
      >
        <Label class="flex items-center gap-1.5 text-xs text-muted-foreground">
          Count
          <Input
            type="number"
            min={1}
            max={100}
            step={1}
            value={numberInput()}
            data-testid="interval-input-number"
            onInput={(e) => setNumberInput(Number(e.currentTarget.value) || 1)}
            class="w-14 h-7 px-2 text-xs"
          />
        </Label>
        <Label class="flex items-center gap-1.5 text-xs text-muted-foreground">
          Interval
          <select
            data-testid="interval-select"
            value={intervalSelect()}
            onChange={(e) => {
              setIntervalSelect(e.currentTarget.value)
              void intervalQuery.refetch()
            }}
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
