import { createSignal } from 'solid-js'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import { clearAllFilters, selectMemoView, transactionsState } from '@stores/transactionsStore'
import type { JSX } from '@solidjs/web'

export default function TransactionMemoFilterField(props: { dataTestId: string }): JSX.Element {
  /** Bumps when URL/store memo filter changes so we can sync the input without applying partial typing to the store. */
  const storeMemoKey = () =>
    `${transactionsState.viewMode ?? ''}\0${transactionsState.selectedMemo}\0${transactionsState.selectedMemoId ?? ''}`

  const committedMemoDisplay = () =>
    transactionsState.viewMode === 'memo' ? transactionsState.selectedMemo : ''

  // A writable derived signal: typing writes the draft, and any change to the
  // store's memo filter re-derives it from the committed value.
  const [draft, setDraft] = createSignal(() => {
    storeMemoKey()
    return committedMemoDisplay()
  })

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
        onCommit={(v, memoId) => {
          if (!v.trim()) {
            clearAllFilters()
            return
          }
          if (memoId != null && memoId > 0) {
            selectMemoView(v.trim(), memoId)
            return
          }
          selectMemoView(v.trim(), null)
        }}
        placeholder="Search memos"
      />
    </label>
  )
}
