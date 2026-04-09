import type { JSX } from 'solid-js'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import { clearAllFilters, selectMemoView, transactionsState } from '@stores/transactionsStore'

export default function TransactionMemoFilterField(props: {
  dataTestId: string
}): JSX.Element {
  return (
    <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
      Memo filter
      <MemoSelect
        dataTestId={props.dataTestId}
        value={transactionsState.selectedMemo}
        onChange={(v, memoId) => {
          if (v) selectMemoView(v, memoId)
          else clearAllFilters()
        }}
        placeholder="Search memos"
      />
    </label>
  )
}
