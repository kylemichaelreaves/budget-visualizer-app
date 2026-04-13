import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import ClearFilterButton from '@components/transactions/summaries/ClearFilterButton'
import TransactionMemoFilterField from '@components/transactions/selects/TransactionMemoFilterField'
import TransactionTimeframeSelect from '@components/transactions/selects/TransactionTimeframeSelect'
import { useHydrateTransactionsTimeframeStoreFromQueries } from '@composables/hydrateTransactionsTimeframeStore'
import { useTransactionTableFilterUrlSync } from '@composables/transactionTableFilterUrlSync'
import {
  clearAllFilters,
  selectDayView,
  selectMonthView,
  selectWeekView,
  selectYearView,
  transactionsState,
} from '@stores/transactionsStore'
import type { DayYear, MonthYear, WeekYear, Year } from '@types'

export default function TransactionsTableSelects(props: Readonly<{ dataTestId?: string }>): JSX.Element {
  const tid = () => props.dataTestId ?? 'transactions-table-selects'

  useTransactionTableFilterUrlSync()

  const yearsQ = useYears()
  const monthsQ = useMonths()
  const weeksQ = useWeeks()
  const daysQ = useDays()

  useHydrateTransactionsTimeframeStoreFromQueries({
    yearsQ,
    monthsQ,
    weeksQ,
    daysQ,
  })

  const yearOptions = createMemo(() => yearsQ.data ?? [])
  const monthOptions = createMemo(() => monthsQ.data ?? [])
  const weekOptions = createMemo(() => weeksQ.data ?? [])
  const dayOptions = createMemo(() => daysQ.data ?? [])

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <TransactionTimeframeSelect<Year>
          label="Year"
          viewMode="year"
          options={yearOptions}
          optionValue={(y) => y.year}
          optionLabel={(y) => y.year}
          selectedValue={() => transactionsState.selectedYear}
          onPick={selectYearView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-year`}
          clearButtonTestId={`${tid()}-year-clear`}
        />

        <TransactionTimeframeSelect<MonthYear>
          label="Month"
          viewMode="month"
          options={monthOptions}
          optionValue={(m) => m.month_year}
          optionLabel={(m) => formatMonthLabel(m.month_year)}
          selectedValue={() => transactionsState.selectedMonth}
          onPick={selectMonthView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-month`}
          clearButtonTestId={`${tid()}-month-clear`}
        />

        <TransactionTimeframeSelect<WeekYear>
          label="Week"
          viewMode="week"
          options={weekOptions}
          optionValue={(w) => w.week_year}
          optionLabel={(w) => formatWeekLabel(w.week_year)}
          selectedValue={() => transactionsState.selectedWeek}
          onPick={selectWeekView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-week`}
          clearButtonTestId={`${tid()}-week-clear`}
        />

        <TransactionTimeframeSelect<DayYear>
          label="Day"
          viewMode="day"
          options={dayOptions}
          optionValue={(d) => String(d.day).split('T')[0] ?? d.day}
          optionLabel={(d) => formatDayLabel(String(d.day).split('T')[0] ?? d.day)}
          selectedValue={() => transactionsState.selectedDay}
          selectValue={() => transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay}
          onPick={selectDayView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-day`}
          clearButtonTestId={`${tid()}-day-clear`}
        />

        <TransactionMemoFilterField dataTestId={`${tid()}-memo-input`} />

        <Show when={transactionsState.viewMode !== null}>
          <ClearFilterButton
            onClick={() => clearAllFilters()}
            dataTestId={`${tid()}-clear-timeframe`}
            class="self-end h-[38px] px-3"
          />
        </Show>
      </div>

      <Show when={yearsQ.isError || monthsQ.isError || weeksQ.isError || daysQ.isError}>
        <p class="text-destructive mt-2 text-sm">
          Some timeframe lists failed to load; dropdowns may be incomplete.
        </p>
      </Show>
    </section>
  )
}
