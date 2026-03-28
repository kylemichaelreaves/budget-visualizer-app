import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode, Timeframe } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import { Input } from '@components/ui/input'

function flattenTree(nodes: CategoryNode[], depth = 0): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (const n of nodes) {
    out.push({ value: n.value, label: `${'\u00A0'.repeat(depth * 2)}${n.label}` })
    if (n.children?.length) {
      out.push(...flattenTree(n.children, depth + 1))
    }
  }
  return out
}

export default function BudgetCategoriesTreeSelect(props: {
  value?: string | null
  onChange: (v: string | null) => void
  placeholder?: string
  dataTestId?: string
  disabled?: boolean
  /** When false, no empty option (selection required). Default true. */
  clearable?: boolean
  /** Search box filters options by label/path (client-side). Default false. */
  filterable?: boolean
  /** Optional timeframe for contextual hierarchy from the API. */
  timeframe?: () => Timeframe | undefined
  /** Date/key paired with `timeframe` (e.g. selected day/week/month). */
  date?: () => string | undefined
  'aria-label'?: string
}): JSX.Element {
  const tid = () => props.dataTestId ?? 'budget-category-tree-select'
  const clearable = () => props.clearable !== false
  const [filter, setFilter] = createSignal('')

  const q = useBudgetCategories(
    () => props.timeframe?.(),
    () => props.date?.(),
    false,
  )

  const treeOptions = createMemo(() => {
    const raw = q.data as unknown
    const categoryData = extractBudgetCategoriesData(raw)
    if (!categoryData || typeof categoryData !== 'object') return [] as { value: string; label: string }[]
    return flattenTree(convertToTree(categoryData))
  })

  const filteredOptions = createMemo(() => {
    const f = filter().trim().toLowerCase()
    const all = treeOptions()
    if (!f) return all
    return all.filter((o) => o.label.trim().toLowerCase().includes(f) || o.value.toLowerCase().includes(f))
  })

  const selectOptions = createMemo(() => {
    const rows = filteredOptions()
    const v = props.value
    if (v && !rows.some((o) => o.value === v)) {
      return [{ value: v, label: `${v} (current)` }, ...rows]
    }
    return rows
  })

  const isDisabled = () => Boolean(props.disabled) || q.isLoading || q.isFetching

  return (
    <div data-testid={`${tid()}-root`}>
      <Show when={q.isError && q.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId={`${tid()}-error`}
          />
        )}
      </Show>

      <Show when={props.filterable}>
        <Input
          type="search"
          data-testid={`${tid()}-filter`}
          placeholder="Filter categories..."
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
          disabled={isDisabled()}
          aria-label="Filter budget categories"
          class="w-full mb-1.5"
        />
      </Show>

      <Show when={q.isLoading || q.isFetching}>
        <p
          data-testid={`${tid()}-loading`}
          class="mt-1 mb-0 text-muted-foreground text-xs"
        >
          Loading categories...
        </p>
      </Show>

      <select
        data-testid={tid()}
        value={props.value ?? ''}
        disabled={isDisabled()}
        aria-busy={q.isLoading || q.isFetching ? 'true' : undefined}
        aria-label={props['aria-label'] ?? 'Budget category'}
        onChange={(e) => {
          const v = e.currentTarget.value
          props.onChange(v || null)
        }}
        class={`w-full p-2 rounded border border-input bg-background text-foreground ${props.filterable ? 'mt-0' : 'mt-1'}`}
      >
        {clearable() ? (
          <option value="">{props.placeholder ?? 'Select a budget category'}</option>
        ) : (
          <option value="" disabled hidden>
            {props.placeholder ?? 'Select a budget category'}
          </option>
        )}
        <For each={selectOptions()}>
          {(o, i) => (
            <option value={o.value} data-testid={`${tid()}-option-${i()}`}>
              {o.label}
            </option>
          )}
        </For>
      </select>
    </div>
  )
}
