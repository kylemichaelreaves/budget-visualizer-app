import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode, Timeframe } from '@types'
import AlertComponent from '@components/shared/AlertComponent'

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
        <input
          type="search"
          data-testid={`${tid()}-filter`}
          placeholder="Filter categories…"
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
          disabled={isDisabled()}
          aria-label="Filter budget categories"
          style={{
            width: '100%',
            'box-sizing': 'border-box',
            padding: '8px',
            'margin-bottom': '6px',
            'border-radius': '4px',
            border: '1px solid #555',
            background: '#1e1e1e',
            color: '#ecf0f1',
          }}
        />
      </Show>

      <Show when={q.isLoading || q.isFetching}>
        <p
          data-testid={`${tid()}-loading`}
          style={{ margin: '4px 0 0', color: '#95a5a6', 'font-size': '0.8rem' }}
        >
          Loading categories…
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
        style={{
          width: '100%',
          padding: '8px',
          'margin-top': props.filterable ? 0 : '4px',
          'border-radius': '4px',
          border: '1px solid #555',
          background: '#1e1e1e',
          color: '#ecf0f1',
        }}
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
