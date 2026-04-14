import { createRenderEffect } from 'solid-js'
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
    recurring: false,
    necessary: false,
    ambiguous: false,
    frequency: '',
    budget_category: null,
  })

  createRenderEffect(() => {
    setForm(memoToFormState(props.memo))
  })

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
