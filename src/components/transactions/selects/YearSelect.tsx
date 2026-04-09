import type { JSX } from 'solid-js'
import { createEffect, createMemo, on } from 'solid-js'
import useYears from '@api/hooks/timeUnits/years/useYears'
import { selectYearView, setYears, transactionsState } from '@stores/transactionsStore'
import type { Year } from '@types'
import TimeframeSelect from './TimeframeSelect'

export default function YearSelect(props: { dataTestId: string }): JSX.Element {
  const yearsQ = useYears()

  createEffect(
    on(
      () => yearsQ.data,
      (data) => {
        if (data) setYears(data as Year[])
      },
    ),
  )

  const options = createMemo(() =>
    ((yearsQ.data ?? []) as Year[]).map((y) => ({ value: y.year, label: y.year })),
  )

  return (
    <TimeframeSelect
      label="Year"
      dataTestId={props.dataTestId}
      viewMode="year"
      value={transactionsState.selectedYear}
      options={options()}
      onSelect={selectYearView}
    />
  )
}
