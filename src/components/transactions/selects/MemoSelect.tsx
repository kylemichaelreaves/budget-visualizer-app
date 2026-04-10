import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import type { Memo } from '@types'
import { useMemoSearch } from '@api/hooks/memos/useMemoSearch'
import AlertComponent from '@components/shared/AlertComponent'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'

export default function MemoSelect(props: {
  value: string
  onChange: (v: string, memoId?: number) => void
  placeholder?: string
  dataTestId?: string
}): JSX.Element {
  const [searchQuery, setSearchQuery] = createSignal('')
  const memosQuery = useMemoSearch({ searchQuery: () => searchQuery() })

  const memoLookup = createMemo(() => {
    const map = new Map<string, number>()
    for (const m of memosQuery.data ?? []) {
      if (m.name) map.set(m.name.trim(), m.id)
    }
    return map
  })

  const [pendingCb, setPendingCb] = createSignal<
    ((results: { value: string; label: string }[]) => void) | null
  >(null)

  createEffect(() => {
    const data = memosQuery.data
    const cb = pendingCb()
    if (cb && data && !memosQuery.isLoading) {
      cb(toOptions(data))
      setPendingCb(null)
    }
  })

  const memoOptions = createMemo(() => toOptions(memosQuery.data ?? []))

  return (
    <div aria-label="Memo Selector">
      <Show when={memosQuery.isError && memosQuery.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId={props.dataTestId ? `${props.dataTestId}-error` : undefined}
          />
        )}
      </Show>
      <AutocompleteComponent
        value={props.value}
        onChange={(v) => {
          const key = v.trim()
          props.onChange(v, memoLookup().get(key))
        }}
        placeholder={props.placeholder ?? 'Select a memo'}
        options={memoOptions()}
        dataTestId={props.dataTestId ?? 'transactions-table-memo-select'}
        minCharacters={1}
        onClear={() => {
          setSearchQuery('')
          setPendingCb(null)
          props.onChange('')
        }}
        onSearch={(query, callback) => {
          setSearchQuery(query)
          setPendingCb(() => callback)
        }}
        loading={memosQuery.isLoading}
      />
    </div>
  )
}

function toOptions(memos: Memo[]): { value: string; label: string }[] {
  const seen = new Set<string>()
  const out: { value: string; label: string }[] = []
  for (const m of memos) {
    const name = m.name?.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push({ value: name, label: name })
  }
  return out
}
