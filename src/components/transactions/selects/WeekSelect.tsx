import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { formatWeekLabel } from '@api/helpers/formatPeriodLabels'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import { selectWeekView, transactionsState } from '@stores/transactionsStore'
import TimeframeSelect from './TimeframeSelect'

export default function WeekSelect(props: { dataTestId: string }): JSX.Element {
  const weeksQ = useWeeks()

  const options = createMemo(() =>
    (weeksQ.data ?? []).map((w) => ({ value: w.week_year, label: formatWeekLabel(w.week_year) })),
  )

  return (
    <TimeframeSelect
      label="Week"
      dataTestId={props.dataTestId}
      viewMode="week"
      value={transactionsState.selectedWeek}
      options={options()}
      onSelect={selectWeekView}
    />
  )
}
