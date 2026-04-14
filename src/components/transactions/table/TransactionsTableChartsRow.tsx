import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import BudgetCategorySummaries from '@components/transactions/charts/BudgetCategorySummaries'
import DailyIntervalLineChart from '@components/transactions/charts/DailyIntervalLineChart/DailyIntervalLineChart'
import type { Accessor } from 'solid-js'
import type { Timeframe } from '@types'

export default function TransactionsTableChartsRow(props: {
  firstDay: string | undefined
  chartTimeFrame: Timeframe
  chartDate: Accessor<string>
}) {
  return (
    <div class="grid gap-6 md:grid-cols-2">
      <Card class="gap-0 justify-between overflow-hidden">
        <CardHeader class="pt-3 pb-0 px-4">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent class="px-3 pb-0 mt-auto">
          <DailyIntervalLineChart dataTestId="transactions-daily-interval-chart" firstDay={props.firstDay} />
        </CardContent>
      </Card>

      <Card class="gap-0 justify-between overflow-hidden">
        <CardHeader class="pt-3 pb-0 px-4">
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent class="px-3 pb-0 mt-auto">
          <BudgetCategorySummaries
            timeFrame={props.chartTimeFrame}
            date={props.chartDate}
            dataTestId="transactions-budget-summaries"
          />
        </CardContent>
      </Card>
    </div>
  )
}
