import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import type { Memo } from '@types'
import { useMemoSearch } from '@api/hooks/memos/useMemoSearch'
import AlertComponent from '@components/shared/AlertComponent'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'

const MEMO_OPT_PREFIX = 'm:'

function optionValueForMemoId(id: number): string {
  return `${MEMO_OPT_PREFIX}${id}`
}

function parseMemoOptionValue(v: string): number | null {
  if (!v.startsWith(MEMO_OPT_PREFIX)) return null
  const n = Number(v.slice(MEMO_OPT_PREFIX.length))
  return Number.isFinite(n) && n > 0 ? n : null
}

function toOptions(memos: Memo[]): { value: string; label: string }[] {
  const nameCounts = new Map<string, number>()
  for (const m of memos) {
    const name = m.name?.trim()
    if (!name) continue
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1)
  }
  const out: { value: string; label: string }[] = []
  for (const m of memos) {
    const name = m.name?.trim()
    if (!name) continue
    const dup = (nameCounts.get(name) ?? 0) > 1
    const label = dup ? `${name} (#${m.id})` : name
    out.push({ value: optionValueForMemoId(m.id), label })
  }
  return out
}

function memoIdForUniqueTypedName(memos: Memo[], trimmed: string): number | undefined {
  const hits = memos.filter((m) => m.name?.trim() === trimmed)
  if (hits.length === 1) return hits[0]!.id
  return undefined
}

export default function MemoSelect(props: {
  value: string
  onChange: (v: string, memoId?: number) => void
  placeholder?: string
  dataTestId?: string
}): JSX.Element {
  const [searchQuery, setSearchQuery] = createSignal('')
  const memosQuery = useMemoSearch({ searchQuery: () => searchQuery() })

  const [pendingCb, setPendingCb] = createSignal<
    ((results: { value: string; label: string }[]) => void) | null
  >(null)

  const memoOptions = createMemo(() => toOptions(memosQuery.data ?? []))

  function applyChange(raw: string) {
    const memos = memosQuery.data ?? []
    const idFromOpt = parseMemoOptionValue(raw)
    if (idFromOpt != null) {
      const m = memos.find((x) => x.id === idFromOpt)
      const name = m?.name?.trim() ?? ''
      props.onChange(name || raw, idFromOpt)
      return
    }
    const trimmed = raw.trim()
    const id = trimmed ? memoIdForUniqueTypedName(memos, trimmed) : undefined
    props.onChange(raw, id)
  }

  createEffect(() => {
    const data = memosQuery.data
    const cb = pendingCb()
    if (cb && data && !memosQuery.isLoading) {
      cb(toOptions(data))
      setPendingCb(null)
    }
  })

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
        onChange={(v) => applyChange(v)}
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
