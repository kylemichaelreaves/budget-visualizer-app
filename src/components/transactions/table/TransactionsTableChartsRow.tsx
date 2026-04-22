import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import BudgetCategorySummaries from '@components/transactions/charts/BudgetCategorySummaries'
import DailyIntervalLineChart from '@components/transactions/charts/DailyIntervalLineChart/DailyIntervalLineChart'
import type { BudgetCategoryColorHelpers } from '@composables/budgetCategoryColors'
import type { Accessor } from 'solid-js'
import type { Timeframe } from '@types'

export default function TransactionsTableChartsRow(props: {
  firstDay: string | undefined
  chartTimeFrame: Timeframe
  chartDate: Accessor<string>
  categoryColors: Accessor<BudgetCategoryColorHelpers>
}) {
  return (
    <div class="grid gap-6 md:grid-cols-2">
      <Card class="gap-0 justify-between h-[420px] overflow-hidden">
        <CardHeader class="pt-3 pb-0 px-4">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent class="px-3 pb-0 mt-auto overflow-hidden">
          <DailyIntervalLineChart dataTestId="transactions-daily-interval-chart" firstDay={props.firstDay} />
        </CardContent>
      </Card>

      <Card class="flex h-[420px] flex-col gap-0 overflow-hidden">
        <CardHeader class="shrink-0 px-4 pb-0 pt-3">
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-0">
          <BudgetCategorySummaries
            timeFrame={props.chartTimeFrame}
            date={props.chartDate}
            categoryColors={props.categoryColors}
            dataTestId="transactions-budget-summaries"
          />
        </CardContent>
      </Card>
    </div>
  )
}
