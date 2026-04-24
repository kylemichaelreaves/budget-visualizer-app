import type { Accessor, JSX } from 'solid-js'
import { Match, Show, Switch } from 'solid-js'
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from '@shared/icons'
import { Card, CardContent } from '@components/ui/card'
import { formatUsdAbs } from '@utils/formatUsd'
import type { MemoSummaryCreditAggregate, MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'

const toneIconWrap: Record<'red' | 'green' | 'violet', string> = {
  red: 'rounded-full bg-negative-muted p-2',
  green: 'rounded-full bg-positive-muted p-2',
  violet: 'rounded-full bg-accent-purple-muted p-2',
}

export type MemoSummaryStatCardProps =
  | {
      mode: 'custom'
      tone: 'red' | 'green' | 'violet'
      label: Accessor<string>
      icon: JSX.Element
      children: JSX.Element
    }
  | {
      mode: 'debit'
      totalDebits: Accessor<MemoSummaryDebitAggregate>
    }
  | {
      mode: 'credit'
      totalCredits: Accessor<MemoSummaryCreditAggregate>
    }

export default function MemoSummaryStatCard(props: MemoSummaryStatCardProps) {
  return (
    <Switch>
      <Match when={props.mode === 'debit' ? props : false}>
        {(p) => {
          const totalDebits = (p() as Extract<MemoSummaryStatCardProps, { mode: 'debit' }>).totalDebits
          return (
            <MemoSummaryStatCardShell
              tone="red"
              label={() => labelForDebit(totalDebits())}
              icon={<DebitAggregateIcon />}
            >
              <>
                <p class="text-2xl font-bold text-negative m-0" data-testid="memo-summary-total-debit">
                  {formatUsdAbs(totalDebits().sum)}
                </p>
                <Show when={totalDebits().debitTxnCount != null}>
                  <p class="text-xs text-muted-foreground mt-1 m-0">
                    {totalDebits().debitTxnCount} debit transaction
                    {totalDebits().debitTxnCount !== 1 ? 's' : ''} on this page
                  </p>
                </Show>
              </>
            </MemoSummaryStatCardShell>
          )
        }}
      </Match>
      <Match when={props.mode === 'credit' ? props : false}>
        {(p) => {
          const totalCredits = (p() as Extract<MemoSummaryStatCardProps, { mode: 'credit' }>).totalCredits
          return (
            <MemoSummaryStatCardShell
              tone="green"
              label={() => labelForCredit(totalCredits())}
              icon={<CreditAggregateIcon />}
            >
              <>
                <p class="text-2xl font-bold text-positive m-0" data-testid="memo-summary-total-credit">
                  {formatUsdAbs(totalCredits().sum)}
                </p>
                <Show when={totalCredits().creditTxnCount != null}>
                  <p class="text-xs text-muted-foreground mt-1 m-0">
                    {totalCredits().creditTxnCount} credit transaction
                    {totalCredits().creditTxnCount !== 1 ? 's' : ''} on this page
                  </p>
                </Show>
              </>
            </MemoSummaryStatCardShell>
          )
        }}
      </Match>
      <Match when={props.mode === 'custom'}>
        {(() => {
          const c = props as Extract<MemoSummaryStatCardProps, { mode: 'custom' }>
          return (
            <MemoSummaryStatCardShell tone={c.tone} label={c.label} icon={c.icon}>
              {c.children}
            </MemoSummaryStatCardShell>
          )
        })()}
      </Match>
    </Switch>
  )
}

function labelForDebit(a: MemoSummaryDebitAggregate): string {
  return a.aggregateScope === 'page' ? 'Debits (this page)' : 'Total Debits'
}

function labelForCredit(a: MemoSummaryCreditAggregate): string {
  return a.aggregateScope === 'page' ? 'Credits (this page)' : 'Total Credits'
}

function DebitAggregateIcon(): JSX.Element {
  return <ArrowDownCircleIcon class="size-5 text-negative" />
}

function CreditAggregateIcon(): JSX.Element {
  return <ArrowUpCircleIcon class="size-5 text-positive" />
}

function MemoSummaryStatCardShell(props: {
  tone: 'red' | 'green' | 'violet'
  label: Accessor<string>
  icon: JSX.Element
  children: JSX.Element
}) {
  return (
    <Card>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class={toneIconWrap[props.tone]}>{props.icon}</div>
          <span class="text-sm font-medium text-muted-foreground">{props.label()}</span>
        </div>
        {props.children}
      </CardContent>
    </Card>
  )
}
