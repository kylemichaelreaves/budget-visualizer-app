import type { JSX } from 'solid-js'
import { createEffect, createMemo, on } from 'solid-js'
import { formatDayLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import { selectDayView, setDays, transactionsState } from '@stores/transactionsStore'
import type { DayYear } from '@types'
import TimeframeSelect from './TimeframeSelect'

export default function DaySelect(props: { dataTestId: string }): JSX.Element {
  const daysQ = useDays()

  createEffect(
    on(
      () => daysQ.data,
      (data) => {
        if (data) setDays(data as DayYear[])
      },
    ),
  )

  const options = createMemo(() =>
    (daysQ.data ?? []).map((d) => {
      const val = String(d.day).split('T')[0] ?? d.day
      return { value: val, label: formatDayLabel(val) }
    }),
  )

  return (
    <TimeframeSelect
      label="Day"
      dataTestId={props.dataTestId}
      viewMode="day"
      value={transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay}
      options={options()}
      onSelect={selectDayView}
      isError={daysQ.isError}
    />
  )
}
