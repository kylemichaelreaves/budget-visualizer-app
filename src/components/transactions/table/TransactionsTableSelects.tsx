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

type TimeframeSelectDescriptor<T, V extends TimeframeViewMode = TimeframeViewMode> = {
  suffix: string
  label: string
  viewMode: V
  options: Accessor<T[]>
  optionValue: (item: T) => string
  optionLabel: (item: T) => string
  selectedValue: Accessor<string>
  onPick: (value: string) => void
  selectValue?: Accessor<string>
}

type SupportedTimeframeSelectDescriptor =
  | TimeframeSelectDescriptor<Year, 'year'>
  | TimeframeSelectDescriptor<MonthYear, 'month'>
  | TimeframeSelectDescriptor<WeekYear, 'week'>
  | TimeframeSelectDescriptor<DayYear, 'day'>

function createTimeframeSelectDescriptor<T, V extends TimeframeViewMode>(
  descriptor: TimeframeSelectDescriptor<T, V>,
): TimeframeSelectDescriptor<T, V> {
  return descriptor
}

function renderTimeframeSelect<T>(
  cfg: TimeframeSelectDescriptor<T, TimeframeViewMode>,
  dataTestId: string,
  clearButtonTestId: string,
): JSX.Element {
  return (
    <TransactionTimeframeSelect<T>
      label={cfg.label}
      viewMode={cfg.viewMode}
      options={cfg.options}
      optionValue={cfg.optionValue}
      optionLabel={cfg.optionLabel}
      selectedValue={cfg.selectedValue}
      selectValue={cfg.selectValue}
      onPick={cfg.onPick}
      onClearFilters={clearAllFilters}
      dataTestId={dataTestId}
      clearButtonTestId={clearButtonTestId}
    />
  )
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
  const timeframeSelectDescriptors: SupportedTimeframeSelectDescriptor[] = [
    createTimeframeSelectDescriptor({
      suffix: 'year',
      label: 'Year',
      viewMode: 'year',
      options: yearOptions,
      optionValue: (item) => item.year,
      optionLabel: (item) => item.year,
      selectedValue: () => transactionsState.selectedYear,
      onPick: selectYearView,
    }),
    createTimeframeSelectDescriptor({
      suffix: 'month',
      label: 'Month',
      viewMode: 'month',
      options: monthOptions,
      optionValue: (item) => item.month_year,
      optionLabel: (item) => formatMonthLabel(item.month_year),
      selectedValue: () => transactionsState.selectedMonth,
      onPick: selectMonthView,
    }),
    createTimeframeSelectDescriptor({
      suffix: 'week',
      label: 'Week',
      viewMode: 'week',
      options: weekOptions,
      optionValue: (item) => item.week_year,
      optionLabel: (item) => formatWeekLabel(item.week_year),
      selectedValue: () => transactionsState.selectedWeek,
      onPick: selectWeekView,
    }),
    createTimeframeSelectDescriptor({
      suffix: 'day',
      label: 'Day',
      viewMode: 'day',
      options: dayOptions,
      optionValue: (item) => String(item.day).split('T')[0],
      optionLabel: (item) => formatDayLabel(String(item.day).split('T')[0]),
      selectedValue: () => transactionsState.selectedDay,
      selectValue: () => transactionsState.selectedDay.split('T')[0],
      onPick: selectDayView,
    }),
  ]

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <For each={timeframeSelectDescriptors}>
          {(cfg) => {
            const dataTestId = `${tid()}-${cfg.suffix}`
            const clearButtonTestId = `${tid()}-${cfg.suffix}-clear`
            switch (cfg.viewMode) {
              case 'year':
                return renderTimeframeSelect(cfg, dataTestId, clearButtonTestId)
              case 'month':
                return renderTimeframeSelect(cfg, dataTestId, clearButtonTestId)
              case 'week':
                return renderTimeframeSelect(cfg, dataTestId, clearButtonTestId)
              case 'day':
                return renderTimeframeSelect(cfg, dataTestId, clearButtonTestId)
            }
          }}
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
