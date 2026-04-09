import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { formatDayLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import { selectDayView, transactionsState } from '@stores/transactionsStore'
import TimeframeSelect from './TimeframeSelect'

export default function DaySelect(props: { dataTestId: string }): JSX.Element {
  const daysQ = useDays()

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
    />
  )
}
