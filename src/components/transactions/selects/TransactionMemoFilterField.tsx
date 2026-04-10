import type { JSX } from 'solid-js'
import { createEffect, createSignal, on } from 'solid-js'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import { clearAllFilters, selectMemoView, transactionsState } from '@stores/transactionsStore'

export default function TransactionMemoFilterField(props: { dataTestId: string }): JSX.Element {
  /** Bumps when URL/store memo filter changes so we can sync the input without applying partial typing to the store. */
  const storeMemoKey = () =>
    `${transactionsState.viewMode ?? ''}\0${transactionsState.selectedMemo}\0${transactionsState.selectedMemoId ?? ''}`

  const committedMemoDisplay = () =>
    transactionsState.viewMode === 'memo' ? transactionsState.selectedMemo : ''

  const [draft, setDraft] = createSignal(committedMemoDisplay())

  createEffect(
    on(storeMemoKey, () => {
      setDraft(committedMemoDisplay())
    }),
  )

  return (
    <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
      Memo filter
      <MemoSelect
        dataTestId={props.dataTestId}
        value={draft()}
        onChange={(v, memoId) => {
          setDraft(v)
          if (!v.trim()) {
            clearAllFilters()
            return
          }
          if (memoId != null && memoId > 0) {
            selectMemoView(v.trim(), memoId)
          }
        }}
        placeholder="Search memos"
      />
    </label>
  )
}
