import { createMemo, createRenderEffect, on } from 'solid-js'
import { createStore } from 'solid-js/store'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import type { Memo } from '@types'
import { buildMemoUpdateInput, memoToFormState, type MemoEditFormState } from './memoEditFormUtils'

export function useMemoEditForm(props: { memo: Memo; onSuccess?: () => void; dataTestId?: string }) {
  const tid = () => props.dataTestId ?? 'memo-edit-form'

  const [form, setForm] = createStore<MemoEditFormState>({
    id: 0,
    name: '',
    necessary: false,
    ambiguous: false,
    frequency: '',
    budget_category: null,
  })

  // Seed once per memo id. A refetch hands down a new `memo` object for the same
  // memo; re-seeding on that overwrote the user's unsaved edits. The id goes through
  // a memo because `on` re-runs whenever its source recomputes, equal value or not.
  const memoId = createMemo(() => props.memo.id)
  createRenderEffect(on(memoId, () => setForm(memoToFormState(props.memo))))

  const mutation = mutateMemo()
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  function save() {
    const name = form.name.trim()
    if (!name) return
    mutation.mutate(buildMemoUpdateInput(form, name), { onSuccess: () => props.onSuccess?.() })
  }

  return {
    form,
    setForm,
    mutation,
    timeFrame,
    selectedValue,
    save,
    tid,
  }
}
