import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@components/ui/pagination'

export default function TablePaginationBar(props: {
  dataTestId: string
  /** Any thrown value; rendered through {@link ApiErrorAlert}. */
  error?: unknown
  /** Names what failed to load. */
  errorTitle?: string
  errorTestId?: string
  pageSize: number
  pageSizeOptions?: number[]
  onPageSizeChange: (size: number) => void
  currentPage: number
  totalPages: number
  totalCount: number
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  prevTestId?: string
  nextTestId?: string
}): JSX.Element {
  /** Always include the current `pageSize` so the controlled <select> has a matching <option>. */
  const sizes = () => {
    const opts = props.pageSizeOptions ?? [25, 50, 100]
    return opts.includes(props.pageSize) ? opts : [...opts, props.pageSize].sort((a, b) => a - b)
  }

  return (
    <div data-testid={props.dataTestId}>
      <ApiErrorAlert
        error={props.error}
        title={props.errorTitle ?? 'Could not load this page'}
        dataTestId={props.errorTestId ?? `${props.dataTestId}-error`}
      />
      <div class="flex items-center gap-3 flex-wrap my-3">
        <label class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">Rows</span>
          <select
            value={props.pageSize}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              props.onPageSizeChange(v)
            }}
            class="p-1.5 rounded"
          >
            <For each={sizes()}>{(n) => <option value={n}>{n}</option>}</For>
          </select>
        </label>
        {/* Kobalte-styled pagination primitives: a labelled <nav> wrapping list
            semantics, so the controls are announced as a pagination group rather
            than two loose buttons. */}
        <Pagination class="mx-0 w-auto justify-start">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                variant="outline"
                onClick={props.onPrev}
                disabled={props.prevDisabled}
                data-testid={props.prevTestId}
              />
            </PaginationItem>
            <PaginationItem>
              <span class="text-foreground px-2" aria-live="polite">
                Page {props.currentPage} / {props.totalPages} ({props.totalCount} total)
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                variant="outline"
                onClick={props.onNext}
                disabled={props.nextDisabled}
                data-testid={props.nextTestId}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
