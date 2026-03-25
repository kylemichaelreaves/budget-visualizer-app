import type { JSX } from 'solid-js'
import { createEffect, createSignal, For, Show } from 'solid-js'
import type { SplitBudgetCategory, Timeframe } from '@types'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import { generateId } from '@components/transactions/helpers/generateId'

export default function SplitBudgetCategoryDrawer(props: {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
  timeframe?: () => Timeframe | undefined
  date?: () => string | undefined
  onSubmit: (splits: SplitBudgetCategory[]) => void
  onCancel: () => void
}): JSX.Element {
  const [local, setLocal] = createSignal<SplitBudgetCategory[]>([])

  createEffect(() => {
    if (props.open) {
      setLocal(props.splits.length ? [...props.splits] : [])
    }
  })

  const total = () => local().reduce((a, s) => a + s.amount_debit, 0)
  const diff = () => Math.abs(total() - props.transactionAmount)
  const isValid = () => diff() <= 0.01 && local().length > 0 && local().every((s) => s.budget_category_id)

  function updateAmount(index: number, v: number) {
    setLocal((rows) => {
      const next = [...rows]
      const row = next[index]
      if (row) next[index] = { ...row, amount_debit: v }
      return next
    })
  }

  function updateCategory(index: number, id: string | null) {
    setLocal((rows) => {
      const next = [...rows]
      const row = next[index]
      if (row) next[index] = { ...row, budget_category_id: id ?? '' }
      return next
    })
  }

  function addSplit() {
    setLocal((rows) => [...rows, { id: generateId(), budget_category_id: '', amount_debit: 0 }])
  }

  function removeSplit(index: number) {
    setLocal((rows) => rows.filter((_, i) => i !== index))
  }

  return (
    <Show when={props.open}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          'z-index': 100,
          display: 'flex',
          'justify-content': 'flex-end',
        }}
        onClick={(e) => e.target === e.currentTarget && props.onCancel()}
      >
        <div
          role="dialog"
          aria-label="Split Budget Category Drawer"
          style={{
            width: 'min(100%, 520px)',
            background: '#2c2c2c',
            color: '#ecf0f1',
            padding: '20px',
            'overflow-y': 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ 'margin-top': 0 }}>Split transaction</h3>
          <p style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>
            Transaction: ${props.transactionAmount.toFixed(2)} · Split total: ${total().toFixed(2)}
            {diff() > 0.01 ? (
              <span style={{ color: '#e74c3c', 'margin-left': '8px' }}>Difference: ${diff().toFixed(2)}</span>
            ) : null}
          </p>
          <For each={local()}>
            {(split, index) => (
              <div
                style={{
                  display: 'grid',
                  'grid-template-columns': '1fr 120px 40px',
                  gap: '8px',
                  'margin-bottom': '12px',
                  'align-items': 'end',
                }}
                data-testid="split-row"
              >
                <BudgetCategoriesTreeSelect
                  value={split.budget_category_id}
                  onChange={(v) => updateCategory(index(), v)}
                  dataTestId={`split-category-${index()}`}
                  timeframe={props.timeframe}
                  date={props.date}
                  filterable
                />
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={split.amount_debit}
                  data-testid={`split-amount-${index()}`}
                  onInput={(e) => updateAmount(index(), Number(e.currentTarget.value) || 0)}
                  style={{ padding: '8px' }}
                />
                <button
                  type="button"
                  onClick={() => removeSplit(index())}
                  data-testid={`split-remove-${index()}`}
                >
                  ×
                </button>
              </div>
            )}
          </For>
          <button type="button" onClick={addSplit} style={{ 'margin-bottom': '16px' }}>
            Add split
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => props.onCancel()}>
              Cancel
            </button>
            <button type="button" disabled={!isValid()} onClick={() => props.onSubmit(local())}>
              Save splits
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
