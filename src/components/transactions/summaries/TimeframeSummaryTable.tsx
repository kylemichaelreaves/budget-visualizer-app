import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import AlertComponent from '@components/shared/AlertComponent'
import { formatUsd } from '@utils/formatUsd'

export type TimeframeSummaryRow = {
  memo: string
  budget_category: string | null | undefined
  amount: number
  count?: number
}

type SortKey = 'memo' | 'budget_category' | 'count' | 'amount'
type SortDir = 'asc' | 'desc'

function SortIcon(props: { active: boolean; dir: SortDir }): JSX.Element {
  return (
    <svg
      class={`size-3 shrink-0 ${props.active ? 'text-primary' : 'opacity-40'}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <Show
        when={props.active}
        fallback={
          <>
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </>
        }
      >
        <path d={props.dir === 'asc' ? 'm7 15 5 5 5-5' : 'm7 9 5-5 5 5'} />
      </Show>
    </svg>
  )
}

export default function TimeframeSummaryTable(props: {
  dataTestId: string
  titleVerb: 'Month' | 'Week'
  selectedPeriod: () => string | undefined | null
  amountHeader: string
  loadingMessage: string
  memoLinkTestId: string
  rows: () => TimeframeSummaryRow[]
  isError: () => boolean
  error: () => unknown
  isLoading: () => boolean
  isFetching: () => boolean
  showTable: () => boolean
  getCategoryColor?: (name: string) => string | undefined
}): JSX.Element | null {
  const id = () => props.dataTestId

  const [sortKey, setSortKey] = createSignal<SortKey>('amount')
  const [sortDir, setSortDir] = createSignal<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey() === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'memo' || key === 'budget_category' ? 'asc' : 'desc')
    }
  }

  const sortedRows = createMemo(() => {
    const data = [...props.rows()]
    const key = sortKey()
    const dir = sortDir()
    data.sort((a, b) => {
      let cmp = 0
      if (key === 'memo') cmp = a.memo.localeCompare(b.memo)
      else if (key === 'budget_category')
        cmp = (a.budget_category ?? '').localeCompare(b.budget_category ?? '')
      else if (key === 'count') cmp = (a.count ?? 1) - (b.count ?? 1)
      else if (key === 'amount') cmp = a.amount - b.amount
      return dir === 'asc' ? cmp : -cmp
    })
    return data
  })

  const totalAmount = createMemo(() => props.rows().reduce((s, r) => s + r.amount, 0))
  const totalCount = createMemo(() => props.rows().reduce((s, r) => s + (r.count ?? 1), 0))

  const thClass =
    'px-3 py-2 text-left text-xs text-muted-foreground font-medium select-none cursor-pointer hover:text-foreground transition-colors'

  return (
    <Show when={props.selectedPeriod()}>
      <Card data-testid={id()}>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <CardTitle class="text-sm font-medium">
            {props.titleVerb} summary — {props.selectedPeriod()}
          </CardTitle>
          <Show when={props.showTable()}>
            <span class="text-xs text-muted-foreground">
              {sortedRows().length} memo{sortedRows().length !== 1 ? 's' : ''} · {totalCount()} transaction
              {totalCount() !== 1 ? 's' : ''}
            </span>
          </Show>
        </CardHeader>

        <CardContent class="p-0 pb-2">
          <Show when={props.isError() ? props.error() : undefined}>
            {(err) => {
              const value = err()
              const normalized =
                value instanceof Error ? value : new Error(typeof value === 'string' ? value : String(value))
              return (
                <div class="px-4">
                  <AlertComponent
                    type="error"
                    title={normalized.name}
                    message={normalized.message}
                    dataTestId={`${id()}-error`}
                  />
                </div>
              )
            }}
          </Show>

          <Show when={props.isLoading() || props.isFetching()}>
            <p class="text-muted-foreground text-xs px-4 py-3">{props.loadingMessage}</p>
          </Show>

          <Show when={props.showTable()}>
            <Show
              when={sortedRows().length > 0}
              fallback={
                <p class="text-xs text-muted-foreground px-4 py-3">
                  No expense transactions for this period.
                </p>
              }
            >
              <div class="max-h-56 overflow-y-auto">
                <table class="w-full text-sm border-collapse">
                  <thead class="sticky top-0 bg-card z-10 border-b border-border">
                    <tr>
                      <th class={thClass} onClick={() => handleSort('memo')}>
                        <span class="flex items-center gap-1">
                          Memo <SortIcon active={sortKey() === 'memo'} dir={sortDir()} />
                        </span>
                      </th>
                      <th class={thClass} onClick={() => handleSort('budget_category')}>
                        <span class="flex items-center gap-1">
                          Category <SortIcon active={sortKey() === 'budget_category'} dir={sortDir()} />
                        </span>
                      </th>
                      <th class={`${thClass} text-right`} onClick={() => handleSort('count')}>
                        <span class="flex items-center justify-end gap-1">
                          <SortIcon active={sortKey() === 'count'} dir={sortDir()} /> Count
                        </span>
                      </th>
                      <th class={`${thClass} text-right`} onClick={() => handleSort('amount')}>
                        <span class="flex items-center justify-end gap-1">
                          <SortIcon active={sortKey() === 'amount'} dir={sortDir()} /> {props.amountHeader}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={sortedRows()}>
                      {(row, i) => (
                        <tr
                          class={`border-b border-border/50 last:border-0 transition-colors hover:bg-accent/40 ${i() % 2 !== 0 ? 'bg-muted/20' : ''}`}
                        >
                          <td class="px-3 py-1.5 max-w-[180px]">
                            <MemoCell memo={row.memo} dataTestId={props.memoLinkTestId} />
                          </td>
                          <td class="px-3 py-1.5 max-w-[140px]">
                            <CategoryPill category={row.budget_category} getColor={props.getCategoryColor} />
                          </td>
                          <td class="px-3 py-1.5 text-right text-muted-foreground tabular-nums">
                            {row.count ?? 1}
                          </td>
                          <td class="px-3 py-1.5 text-right font-medium tabular-nums">
                            {formatUsd(row.amount)}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                  <tfoot class="sticky bottom-0 bg-card border-t border-border">
                    <tr>
                      <td class="px-3 py-1.5 text-xs text-muted-foreground font-medium">Total</td>
                      <td />
                      <td class="px-3 py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                        {totalCount()}
                      </td>
                      <td class="px-3 py-1.5 text-right text-xs font-semibold tabular-nums">
                        {formatUsd(totalAmount())}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Show>
          </Show>
        </CardContent>
      </Card>
    </Show>
  )
}

function CategoryPill(props: {
  category: string | null | undefined
  getColor?: (name: string) => string | undefined
}): JSX.Element {
  const cat = () => props.category
  return (
    <Show when={cat()} fallback={<span class="text-muted-foreground">—</span>}>
      {(c) => {
        const color = () => props.getColor?.(c())
        return (
          <Badge
            variant="outline"
            class="text-xs truncate max-w-full"
            style={color() ? { 'border-color': color(), color: color() } : undefined}
          >
            {c()}
          </Badge>
        )
      }}
    </Show>
  )
}

function MemoCell(props: { memo: string; dataTestId: string }): JSX.Element {
  const m = () => props.memo
  const asNum = () => {
    const n = Number(m())
    return Number.isFinite(n) && String(n) === m().trim() ? n : null
  }
  return (
    <Show
      when={asNum() != null}
      fallback={
        <span class="truncate block text-foreground" title={m()}>
          {m()}
        </span>
      }
    >
      <A
        href={`/budget-visualizer/memos/${asNum()}/summary`}
        data-testid={props.dataTestId}
        class="truncate block"
      >
        {m()}
      </A>
    </Show>
  )
}
