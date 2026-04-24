import type { Accessor, JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import { Badge } from '@components/ui/badge'
import ClearFilterButton from '@components/shared/ClearFilterButton'
import TransactionMemoFilterField from '@components/transactions/selects/TransactionMemoFilterField'
import TransactionTimeframeSelect, {
  type TimeframeViewMode,
} from '@components/transactions/selects/TransactionTimeframeSelect'
import { useHydrateTransactionsTimeframeStoreFromQueries } from '@composables/hydrateTransactionsTimeframeStore'
import { useTransactionTableFilterUrlSync } from '@composables/transactionTableFilterUrlSync'
import {
  clearAllFilters,
  selectDayView,
  selectMonthView,
  selectWeekView,
  selectYearView,
  setSelectedBudgetCategory,
  transactionsState,
} from '@stores/transactionsStore'
import type { DayYear, MonthYear, WeekYear, Year } from '@types'

type TimeframeSelectDescriptor = {
  suffix: string
  label: string
  viewMode: TimeframeViewMode
  options: Accessor<unknown[]>
  optionValue: (item: unknown) => string
  optionLabel: (item: unknown) => string
  selectedValue: Accessor<string>
  onPick: (value: string) => void
  selectValue?: Accessor<string>
}

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

  /** Stable per instance; option lists flow through accessors so children track query updates. */
  const timeframeSelectDescriptors: TimeframeSelectDescriptor[] = [
    {
      suffix: 'year',
      label: 'Year',
      viewMode: 'year',
      options: yearOptions as Accessor<unknown[]>,
      optionValue: (item) => (item as Year).year,
      optionLabel: (item) => (item as Year).year,
      selectedValue: () => transactionsState.selectedYear,
      onPick: selectYearView,
    },
    {
      suffix: 'month',
      label: 'Month',
      viewMode: 'month',
      options: monthOptions as Accessor<unknown[]>,
      optionValue: (item) => (item as MonthYear).month_year,
      optionLabel: (item) => formatMonthLabel((item as MonthYear).month_year),
      selectedValue: () => transactionsState.selectedMonth,
      onPick: selectMonthView,
    },
    {
      suffix: 'week',
      label: 'Week',
      viewMode: 'week',
      options: weekOptions as Accessor<unknown[]>,
      optionValue: (item) => (item as WeekYear).week_year,
      optionLabel: (item) => formatWeekLabel((item as WeekYear).week_year),
      selectedValue: () => transactionsState.selectedWeek,
      onPick: selectWeekView,
    },
    {
      suffix: 'day',
      label: 'Day',
      viewMode: 'day',
      options: dayOptions as Accessor<unknown[]>,
      optionValue: (item) => String((item as DayYear).day).split('T')[0] ?? (item as DayYear).day,
      optionLabel: (item) =>
        formatDayLabel(String((item as DayYear).day).split('T')[0] ?? (item as DayYear).day),
      selectedValue: () => transactionsState.selectedDay,
      selectValue: () => transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay,
      onPick: selectDayView,
    },
  ]

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <For each={timeframeSelectDescriptors}>
          {(cfg) => (
            <TransactionTimeframeSelect<unknown>
              label={cfg.label}
              viewMode={cfg.viewMode}
              options={cfg.options}
              optionValue={cfg.optionValue}
              optionLabel={cfg.optionLabel}
              selectedValue={cfg.selectedValue}
              selectValue={cfg.selectValue}
              onPick={cfg.onPick}
              onClearFilters={clearAllFilters}
              dataTestId={`${tid()}-${cfg.suffix}`}
              clearButtonTestId={`${tid()}-${cfg.suffix}-clear`}
            />
          )}
        </For>

        <TransactionMemoFilterField dataTestId={`${tid()}-memo-input`} />

        <Show when={transactionsState.selectedBudgetCategory}>
          <Badge
            variant="secondary"
            class="self-end h-[38px] gap-1.5 px-3 text-sm"
            data-testid={`${tid()}-budget-category-chip`}
          >
            {transactionsState.selectedBudgetCategory}
            <button
              type="button"
              class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => setSelectedBudgetCategory(null)}
              aria-label="Clear budget category filter"
              data-testid={`${tid()}-budget-category-clear`}
            >
              <svg
                class="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </Badge>
        </Show>

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
