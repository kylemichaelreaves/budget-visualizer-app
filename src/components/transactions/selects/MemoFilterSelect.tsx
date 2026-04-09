import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'
import { clearAllFilters, selectMemoView, transactionsState } from '@stores/transactionsStore'

export default function MemoFilterSelect(props: { dataTestId: string }): JSX.Element {
  const memoOptions = createMemo(() => transactionsState.memos.map((m) => ({ value: m.name, label: m.name })))

  return (
    <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
      Memo filter
      <AutocompleteComponent
        dataTestId={props.dataTestId}
        value={transactionsState.selectedMemo}
        onChange={(v) => {
          if (v) selectMemoView(v)
          else clearAllFilters()
        }}
        onClear={() => clearAllFilters()}
        options={memoOptions()}
        placeholder="Memo id or name"
      />
    </label>
  )
}
