import { createMemo, createStore, untrack } from 'solid-js'
import useTimeframeTypeAndValue from '@composables/useTimeframeTypeAndValue'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import type { Memo } from '@types'
import { buildMemoUpdateInput, memoToFormState, type MemoEditFormState } from './memoEditFormUtils'

export function useMemoEditForm(props: { memo: Memo; onSuccess?: () => void; dataTestId?: string }) {
  const tid = () => props.dataTestId ?? 'memo-edit-form'

  // Seeded once per memo id. A refetch hands down a new `memo` object for the same
  // memo; re-seeding on that overwrote the user's unsaved edits. A derived store
  // re-runs its seed only when what it tracks changes, so it tracks the id (through a
  // memo, which skips equal values) and reads the memo itself untracked. Writes
  // through `setForm` stand until the next re-seed.
  const memoId = createMemo(() => props.memo.id)
  const [form, setForm] = createStore<MemoEditFormState>(
    () => {
      memoId()
      return untrack(() => memoToFormState(props.memo))
    },
    { id: 0, name: '', necessary: false, ambiguous: false, frequency: '', budget_category: null },
  )

  const mutation = mutateMemo()
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  function save() {
    const name = form.name.trim()
    if (!name) return
    void mutation.mutate(buildMemoUpdateInput(form, name)).then(
      () => props.onSuccess?.(),
      () => {},
    )
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
