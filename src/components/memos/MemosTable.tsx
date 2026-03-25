import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, For, on, Show } from 'solid-js'
import useMemos from '@api/hooks/memos/useMemos'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import { clearMemosByOffset, transactionsState } from '@stores/transactionsStore'
import type { Memo } from '@types'
import MemosTablePagination from './MemosTablePagination'

const columns: { prop: keyof Memo | 'actions'; label: string }[] = [
  { prop: 'id', label: 'ID' },
  { prop: 'name', label: 'Name' },
  { prop: 'recurring', label: 'Recurring' },
  { prop: 'necessary', label: 'Necessary' },
  { prop: 'frequency', label: 'Frequency' },
  { prop: 'budget_category', label: 'Budget category' },
  { prop: 'ambiguous', label: 'Ambiguous' },
  { prop: 'total_amount_debit', label: 'Total debit' },
  { prop: 'transactions_count', label: 'Tx count' },
  { prop: 'actions', label: '' },
]

function formatCurrency(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function cellValue(row: Memo, prop: keyof Memo | 'actions'): string {
  if (prop === 'actions') return ''
  const v = row[prop]
  if (v == null) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number' && prop === 'total_amount_debit') return formatCurrency(v)
  return String(v)
}

export default function MemosTable(): JSX.Element {
  const query = useMemos()

  const LIMIT = () => transactionsState.memosTableLimit

  const flattenedData = createMemo(() => query.data?.pages.flat() ?? [])

  const currentPage = () =>
    Math.floor(transactionsState.memosTableOffset / transactionsState.memosTableLimit) + 1

  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * LIMIT()
    return flattenedData().slice(start, start + LIMIT())
  })

  const isLoadingCondition = () =>
    query.isLoading ||
    query.isFetching ||
    query.isRefetching ||
    query.isFetchingNextPage ||
    query.isFetchingPreviousPage

  async function loadMorePagesIfNeeded() {
    const requiredDataCount = currentPage() * LIMIT()
    while (flattenedData().length < requiredDataCount && query.hasNextPage) {
      await query.fetchNextPage()
    }
  }

  createEffect(
    on(
      () => currentPage(),
      () => {
        void loadMorePagesIfNeeded()
      },
    ),
  )

  createEffect(
    on(
      () => transactionsState.memosTableLimit,
      () => {
        clearMemosByOffset()
        void query.refetch()
      },
    ),
  )

  return (
    <>
      <Show when={query.isError && query.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="memos-table-error-alert"
          />
        )}
      </Show>

      <h2 style={{ color: '#ecf0f1', 'margin-top': 0 }}>Memos</h2>

      <Show when={isLoadingCondition()}>
        <TableSkeleton
          columns={columns
            .filter((c) => c.prop !== 'actions')
            .map((c) => ({ prop: c.prop as string, label: c.label }))}
          rows={LIMIT()}
          dataTestId="memos-table-skeleton"
        />
      </Show>

      <Show when={!isLoadingCondition() && paginatedData().length > 0}>
        <table
          data-testid="memos-table"
          style={{
            width: '100%',
            'border-collapse': 'collapse',
            color: '#ecf0f1',
            'font-size': '0.85rem',
          }}
        >
          <thead>
            <tr style={{ 'border-bottom': '1px solid #555' }}>
              <For each={columns}>
                {(col) => (
                  <th
                    style={{ padding: '8px 6px', 'text-align': 'left' }}
                    data-testid={`column-${String(col.prop)}`}
                  >
                    {col.label}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={paginatedData()}>
              {(row) => (
                <tr style={{ 'border-bottom': '1px solid #444' }}>
                  <For each={columns}>
                    {(col) => (
                      <td style={{ padding: '8px 6px' }} data-testid={`cell-${row.id}-${String(col.prop)}`}>
                        {col.prop === 'id' ? (
                          <A
                            href={`/budget-visualizer/memos/${row.id}/summary`}
                            data-testid={`memo-id-link-${row.id}`}
                          >
                            {String(row.id)}
                          </A>
                        ) : col.prop === 'actions' ? (
                          <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
                            <A
                              href={`/budget-visualizer/memos/${row.id}/summary`}
                              data-testid={`memo-summary-link-${row.id}`}
                            >
                              Summary
                            </A>
                            <A
                              href={`/budget-visualizer/memos/${row.id}/edit`}
                              data-testid={`memo-edit-link-${row.id}`}
                            >
                              Edit
                            </A>
                          </div>
                        ) : (
                          <span>{cellValue(row, col.prop)}</span>
                        )}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>

      <Show when={!isLoadingCondition() && paginatedData().length === 0}>
        <p style={{ color: '#95a5a6' }}>No memos found.</p>
      </Show>

      <MemosTablePagination />
    </>
  )
}
