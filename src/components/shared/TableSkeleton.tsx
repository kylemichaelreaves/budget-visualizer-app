import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { Skeleton } from '@components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'

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
    <div data-testid={props.dataTestId ?? 'table-skeleton'}>
      <Table>
        <TableHeader>
          <TableRow>
            <For each={props.columns}>{(column) => <TableHead>{column.label}</TableHead>}</For>
          </TableRow>
        </TableHeader>
        <TableBody>
          <For each={rows()}>
            {() => (
              <TableRow>
                <For each={props.columns}>
                  {(column) => (
                    <TableCell>
                      <Skeleton class="h-4 rounded" style={{ width: skeletonWidth(column.prop) }} />
                    </TableCell>
                  )}
                </For>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
    </div>
  )
}
