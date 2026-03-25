import type { JSX } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
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
        style={{
          display: 'flex',
          'align-items': 'flex-end',
          'justify-content': 'flex-end',
          gap: '12px',
          'flex-wrap': 'wrap',
          opacity: isOutOfRange() ? 0.5 : 1,
          'pointer-events': isOutOfRange() ? 'none' : 'auto',
        }}
      >
        <label style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>
          Interval count
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={numberInput()}
            data-testid="interval-input-number"
            onInput={(e) => setNumberInput(Number(e.currentTarget.value) || 1)}
            style={{ display: 'block', width: '80px', 'margin-top': '4px', padding: '6px' }}
          />
        </label>
        <label style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>
          Interval type
          <select
            data-testid="interval-select"
            value={intervalSelect()}
            onChange={(e) => {
              setIntervalSelect(e.currentTarget.value)
              void intervalQuery.refetch()
            }}
            style={{ display: 'block', 'margin-top': '4px', padding: '6px' }}
          >
            <option value="days">{numberInput() === 1 ? 'Day' : 'Days'}</option>
            <option value="weeks">{numberInput() === 1 ? 'Week' : 'Weeks'}</option>
            <option value="months">{numberInput() === 1 ? 'Month' : 'Months'}</option>
            <option value="years">{numberInput() === 1 ? 'Year' : 'Years'}</option>
          </select>
        </label>
      </div>
    </div>
  )
}
