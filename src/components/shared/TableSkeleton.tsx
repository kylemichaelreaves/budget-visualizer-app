import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import './shared-ui.css'

export type SkeletonColumn = { prop: string; label: string }

const widthMap: Record<string, string> = {
  id: '60px',
  transaction_number: '120px',
  date: '100px',
  description: '200px',
  memo_id: '80px',
  memo: '100px',
  amount_debit: '100px',
  amount_credit: '100px',
  balance: '100px',
  budget_category: '150px',
}

function skeletonWidth(columnProp: string): string {
  return widthMap[columnProp] ?? '120px'
}

export default function TableSkeleton(props: {
  columns: SkeletonColumn[]
  rows?: number
  dataTestId?: string
}): JSX.Element {
  const rowCount = () => props.rows ?? 10
  const rows = () => Array.from({ length: rowCount() }, (_, i) => i)

  return (
    <div class="table-skeleton" data-testid={props.dataTestId ?? 'table-skeleton'}>
      <table class="bv-table-skeleton">
        <thead>
          <tr>
            <For each={props.columns}>{(column) => <th>{column.label}</th>}</For>
          </tr>
        </thead>
        <tbody>
          <For each={rows()}>
            {() => (
              <tr>
                <For each={props.columns}>
                  {(column) => (
                    <td>
                      <span class="bv-shimmer" style={{ width: skeletonWidth(column.prop) }} />
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
