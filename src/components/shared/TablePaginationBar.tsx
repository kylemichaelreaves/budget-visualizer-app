import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'

export default function TablePaginationBar(props: {
  dataTestId: string
  /** Accepts any thrown value; non-Error values are wrapped so `.name`/`.message` always render. */
  error?: unknown
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

  const errorAlert = () => {
    const err = props.error
    if (err == null) return null
    const normalized = err instanceof Error ? err : new Error(String(err))
    return (
      <AlertComponent
        type="error"
        title={normalized.name}
        message={normalized.message}
        dataTestId={props.errorTestId ?? `${props.dataTestId}-error`}
      />
    )
  }

  return (
    <div data-testid={props.dataTestId}>
      {errorAlert()}
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
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={props.onPrev}
          disabled={props.prevDisabled}
          data-testid={props.prevTestId}
        >
          Previous
        </Button>
        <span class="text-foreground">
          Page {props.currentPage} / {props.totalPages} ({props.totalCount} total)
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={props.onNext}
          disabled={props.nextDisabled}
          data-testid={props.nextTestId}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
