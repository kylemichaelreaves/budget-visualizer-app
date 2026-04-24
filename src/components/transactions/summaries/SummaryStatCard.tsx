import type { Accessor, JSX } from 'solid-js'
import { Match, Switch } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { SummaryCreditStatIcon, SummaryDebitStatIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'

type SummaryStatCardGenericProps = {
  title: string
  icon: JSX.Element
  value: JSX.Element
  subtitle?: string
  dataTestId?: string
}

type SummaryStatCardDebitCreditProps = {
  variant: 'debit' | 'credit'
  total: number
  count: number
}

export type SummaryStatCardProps = SummaryStatCardGenericProps | SummaryStatCardDebitCreditProps

function isDebitCredit(props: SummaryStatCardProps): props is SummaryStatCardDebitCreditProps {
  return 'variant' in props
}

export default function SummaryStatCard(props: SummaryStatCardProps): JSX.Element {
  return (
    <Switch>
      <Match when={isDebitCredit(props) ? props : false}>
        {(p) => {
          const row = p() as SummaryStatCardDebitCreditProps
          const isDebit = row.variant === 'debit'
          const dataTestId = row.variant === 'debit' ? 'summary-debits-card' : 'summary-credits-card'
          return (
            <Card data-testid={dataTestId}>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">
                  {isDebit ? 'Total Debits' : 'Total Credits'}
                </CardTitle>
                {isDebit ? <SummaryDebitStatIcon /> : <SummaryCreditStatIcon />}
              </CardHeader>
              <CardContent>
                {isDebit ? (
                  <div class="text-2xl font-bold text-negative">-{formatUsdAbs(row.total)}</div>
                ) : (
                  <div class="text-2xl font-bold text-positive">+{formatUsdAbs(row.total)}</div>
                )}
                <p class="text-xs text-muted-foreground mt-1">
                  {isDebit
                    ? `${row.count} expense transaction${row.count !== 1 ? 's' : ''}`
                    : `${row.count} income transaction${row.count !== 1 ? 's' : ''}`}
                </p>
              </CardContent>
            </Card>
          )
        }}
      </Match>
      <Match when={!isDebitCredit(props)}>
        <SummaryStatCardGenericBranch getCard={() => props} />
      </Match>
    </Switch>
  )
}

function SummaryStatCardGenericBranch(props: { getCard: Accessor<SummaryStatCardProps> }): JSX.Element {
  const p = () => props.getCard() as SummaryStatCardGenericProps
  return (
    <Card data-testid={p().dataTestId}>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{p().title}</CardTitle>
        {p().icon}
      </CardHeader>
      <CardContent>
        {p().value}
        {p().subtitle ? <p class="text-xs text-muted-foreground mt-1">{p().subtitle}</p> : null}
      </CardContent>
    </Card>
  )
}
