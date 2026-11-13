import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { SummaryCreditStatIcon, SummaryDebitStatIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'

export type SummaryStatCardProps = {
  variant: 'debit' | 'credit'
  total: number
  count: number
}

export default function SummaryStatCard(props: SummaryStatCardProps): JSX.Element {
  const isDebit = () => props.variant === 'debit'
  const plural = () => (props.count === 1 ? '' : 's')
  return (
    <Card data-testid={isDebit() ? 'summary-debits-card' : 'summary-credits-card'}>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{isDebit() ? 'Total Debits' : 'Total Credits'}</CardTitle>
        <Show when={isDebit()} fallback={<SummaryCreditStatIcon />}>
          <SummaryDebitStatIcon />
        </Show>
      </CardHeader>
      <CardContent>
        <Show
          when={isDebit()}
          fallback={<div class="text-2xl font-bold text-positive">+{formatUsdAbs(props.total)}</div>}
        >
          <div class="text-2xl font-bold text-negative">-{formatUsdAbs(props.total)}</div>
        </Show>
        <p class="text-xs text-muted-foreground mt-1">
          {`${props.count} ${isDebit() ? 'expense' : 'income'} transaction${plural()}`}
        </p>
      </CardContent>
    </Card>
  )
}
