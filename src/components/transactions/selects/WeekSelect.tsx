import type { JSX } from 'solid-js'
import { createEffect, createMemo, on } from 'solid-js'
import { formatWeekLabel } from '@api/helpers/formatPeriodLabels'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import { selectWeekView, setWeeks, transactionsState } from '@stores/transactionsStore'
import type { WeekYear } from '@types'
import TimeframeSelect from './TimeframeSelect'

export default function WeekSelect(props: { dataTestId: string }): JSX.Element {
  const weeksQ = useWeeks()

  createEffect(
    on(
      () => weeksQ.data,
      (data) => {
        if (data) setWeeks(data as WeekYear[])
      },
    ),
  )

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
