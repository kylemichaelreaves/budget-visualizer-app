import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table'
import { Button } from '@components/ui/button'

export type TableColumn = {
  prop: string
  label: string
  formatter?: (value: string) => string
}

export default function TableComponent(props: {
  tableData: Record<string, unknown>[]
  columns: TableColumn[]
  sortableColumns?: string[]
  isFetching?: boolean
  rowKey?: string
  routerLinkColumn?: Record<string, string>
  dataTestId?: string
}): JSX.Element {
  const sortable = () => props.sortableColumns ?? []

  const [sortProp, setSortProp] = createSignal<string>('date')
  const [sortOrder, setSortOrder] = createSignal<'ascending' | 'descending'>('descending')
  const [currentPage, setCurrentPage] = createSignal(1)
  const [pageSize, setPageSize] = createSignal(100)

  const sortedData = createMemo(() => {
    const data = [...props.tableData]
    const prop = sortProp()
    const order = sortOrder()
    if (!sortable().includes(prop)) {
      return data
    }
    return data.sort((a, b) => {
      const av = a[prop]
      const bv = b[prop]
      const as = av == null ? '' : String(av)
      const bs = bv == null ? '' : String(bv)
      const cmp = as.localeCompare(bs, undefined, { numeric: true })
      return order === 'ascending' ? cmp : -cmp
    })
  })

  const pagedData = createMemo(() => {
    const start = (currentPage() - 1) * pageSize()
    const end = currentPage() * pageSize()
    return sortedData().slice(start, end)
  })

  const showPagination = () => sortedData().length > pageSize()

  function toggleSort(prop: string) {
    if (!sortable().includes(prop)) return
    if (sortProp() === prop) {
      setSortOrder((o) => (o === 'ascending' ? 'descending' : 'ascending'))
    } else {
      setSortProp(prop)
      setSortOrder('ascending')
    }
    setCurrentPage(1)
  }

  return (
    <div
      class={props.isFetching ? 'opacity-50 pointer-events-none' : ''}
      data-testid={props.dataTestId}
    >
      <Show when={props.tableData?.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <For each={props.columns}>
                {(column) => (
                  <TableHead
                    class={sortable().includes(column.prop) ? 'cursor-pointer select-none hover:text-primary' : ''}
                    onClick={() => toggleSort(column.prop)}
                  >
                    {column.label}
                    {sortable().includes(column.prop) && sortProp() === column.prop
                      ? sortOrder() === 'ascending'
                        ? ' ▲'
                        : ' ▼'
                      : ''}
                  </TableHead>
                )}
              </For>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={pagedData()}>
              {(row) => (
                <TableRow
                  data-row-key={
                    props.rowKey && row[props.rowKey] != null ? String(row[props.rowKey]) : undefined
                  }
                >
                  <For each={props.columns}>
                    {(column) => {
                      const raw = row[column.prop]
                      const str = raw == null ? '' : String(raw)
                      const linkBase = props.routerLinkColumn?.[column.prop]
                      return (
                        <TableCell>
                          <Show when={linkBase} fallback={column.formatter ? column.formatter(str) : str}>
                            {(base) => <A href={`${base()}/${encodeURIComponent(str)}`}>{str}</A>}
                          </Show>
                        </TableCell>
                      )
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>

      <Show when={showPagination()}>
        <div class="flex items-center justify-between gap-4 py-3 text-sm text-muted-foreground">
          <span>
            Total {sortedData().length} · Page {currentPage()} /{' '}
            {Math.max(1, Math.ceil(sortedData().length / pageSize()))}
          </span>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-1.5">
              Rows
              <select
                class="rounded-md border border-input bg-input-background px-2 py-1 text-sm text-foreground"
                value={pageSize()}
                onChange={(e) => {
                  setPageSize(Number(e.currentTarget.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={100}>100</option>
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage() <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => (p < Math.ceil(sortedData().length / pageSize()) ? p + 1 : p))
              }
              disabled={currentPage() >= Math.ceil(sortedData().length / pageSize())}
            >
              Next
            </Button>
          </div>
        </div>
      </Show>
    </div>
  )
}
