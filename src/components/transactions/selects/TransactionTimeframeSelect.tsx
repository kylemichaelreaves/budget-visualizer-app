import type { Accessor, JSX } from 'solid-js'
import { For, Show, createEffect } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'

const selectBase =
  'p-2 pr-8 rounded border bg-background text-foreground appearance-none'
const activeBorder = 'border-brand'
const inactiveBorder = 'border-input'

export type TimeframeViewMode = 'year' | 'month' | 'week' | 'day'

export type TransactionTimeframeSelectProps<T> = {
  label: string
  viewMode: TimeframeViewMode
  options: Accessor<T[]>
  optionValue: (item: T) => string
  optionLabel: (item: T) => string
  /** Raw value from the transactions store */
  selectedValue: Accessor<string>
  /**
   * Value to pass to `<select value={...}>` (e.g. day strips the time portion).
   * Defaults to `selectedValue()`.
   */
  selectValue?: Accessor<string>
  onPick: (value: string) => void
  onClearFilters: () => void
  dataTestId: string
  clearButtonTestId: string
}

function InlineSelectClear(props: { testId: string; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer z-10"
      aria-label="Clear"
      data-testid={props.testId}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        props.onClick()
      }}
    >
      <svg
        class="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    </button>
  )
}

function selectClasses(viewMode: TimeframeViewMode): string {
  return `${selectBase} ${transactionsState.viewMode === viewMode ? activeBorder : inactiveBorder}`
}

export default function TransactionTimeframeSelect<T>(props: TransactionTimeframeSelectProps<T>): JSX.Element {
  let selectRef: HTMLSelectElement | undefined

  const valueOnSelect = () => props.selectValue?.() ?? props.selectedValue()

  createEffect(() => {
    props.options()
    const v = valueOnSelect()
    if (selectRef) selectRef.value = v
  })

  return (
    <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
      {props.label}
      <div class="relative">
        <select
          ref={(el) => (selectRef = el)}
          data-testid={props.dataTestId}
          value={valueOnSelect()}
          onChange={(e) => {
            const v = e.currentTarget.value
            if (v) props.onPick(v)
            else props.onClearFilters()
          }}
          class={`w-full ${selectClasses(props.viewMode)}`}
        >
          <option value="">Any</option>
          <For each={props.options}>
            {(item) => (
              <option value={props.optionValue(item)}>{props.optionLabel(item)}</option>
            )}
          </For>
        </select>
        <Show when={props.selectedValue()}>
          <InlineSelectClear testId={props.clearButtonTestId} onClick={props.onClearFilters} />
        </Show>
      </div>
    </label>
  )
}
