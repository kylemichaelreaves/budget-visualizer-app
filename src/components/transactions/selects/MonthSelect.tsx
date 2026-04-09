import type { JSX } from 'solid-js'
import { createEffect, createMemo, on } from 'solid-js'
import { formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import { selectMonthView, setMonths, transactionsState } from '@stores/transactionsStore'
import type { MonthYear } from '@types'
import TimeframeSelect from './TimeframeSelect'

export default function MonthSelect(props: { dataTestId: string }): JSX.Element {
  const monthsQ = useMonths()

  createEffect(
    on(
      () => monthsQ.data,
      (data) => {
        if (data) setMonths(data as MonthYear[])
      },
    ),
  )

  const options = createMemo(() =>
    ((monthsQ.data ?? []) as MonthYear[]).map((m) => ({
      value: m.month_year,
      label: formatMonthLabel(m.month_year),
    })),
  )

  return (
    <TimeframeSelect
      label="Month"
      dataTestId={props.dataTestId}
      viewMode="month"
      value={transactionsState.selectedMonth}
      options={options()}
      onSelect={selectMonthView}
    />
  )
}
