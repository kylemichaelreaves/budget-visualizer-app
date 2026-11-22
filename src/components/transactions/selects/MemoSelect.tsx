import { createEffect, createMemo, createSignal } from 'solid-js'
import { settledData } from '@api/helpers/settledData'
import type { Memo } from '@types'
import { useMemoSearch } from '@api/hooks/memos/useMemoSearch'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'
import type { JSX } from '@solidjs/web'
import { queryFlag } from '@api/helpers/queryFlag'

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
  /**
   * Called when the input blurs so parents can commit a memo-name filter when `memoId`
   * is still unknown (ambiguous name, slow search, or free-text match).
   */
  onCommit?: (v: string, memoId?: number) => void
  placeholder?: string
  dataTestId?: string
}): JSX.Element {
  const [searchQuery, setSearchQuery] = createSignal('')
  const memosQuery = useMemoSearch({ searchQuery: () => searchQuery() })

  const [pendingCb, setPendingCb] = createSignal<
    ((results: { value: string; label: string }[]) => void) | null
  >(null)

  const memoOptions = createMemo(() => toOptions(settledData(memosQuery) ?? []))

  function applyChange(raw: string) {
    const memos = settledData(memosQuery) ?? []
    const idFromOpt = parseMemoOptionValue(raw)
    if (idFromOpt != null) {
      const m = memos.find((x) => x.id === idFromOpt)
      if (m) {
        const name = m.name?.trim() ?? ''
        props.onChange(name || String(idFromOpt), idFromOpt)
      } else {
        // Avoid persisting internal `m:id` when results no longer include that memo
        props.onChange(String(idFromOpt), idFromOpt)
      }
      return
    }
    const trimmed = raw.trim()
    const id = trimmed ? memoIdForUniqueTypedName(memos, trimmed) : undefined
    props.onChange(raw, id)
  }

  createEffect(
    () => ({ data: settledData(memosQuery), cb: pendingCb(), isLoading: queryFlag(memosQuery, 'isLoading') }),
    ({ data, cb, isLoading }) => {
      if (cb && data && !isLoading) {
        cb(toOptions(data))
        setPendingCb(null)
      }
    },
  )

  function commitFromCurrentValue() {
    const trimmed = props.value.trim()
    if (!trimmed) {
      props.onCommit?.('', undefined)
      return
    }
    const memos = settledData(memosQuery) ?? []
    const id = memoIdForUniqueTypedName(memos, trimmed)
    props.onCommit?.(trimmed, id)
  }

  return (
    <div aria-label="Memo Selector">
      <ApiErrorAlert
        error={memosQuery.isError && memosQuery.error}
        title="Could not load memos"
        dataTestId={props.dataTestId ? `${props.dataTestId}-error` : undefined}
      />
      <AutocompleteComponent
        value={props.value}
        onChange={(v) => applyChange(v)}
        onInputBlur={() => {
          if (props.onCommit) commitFromCurrentValue()
        }}
        onEnterNoSuggestions={() => {
          if (props.onCommit) commitFromCurrentValue()
        }}
        placeholder={props.placeholder ?? 'Select a memo'}
        options={memoOptions()}
        dataTestId={props.dataTestId ?? 'transactions-table-memo-select'}
        minCharacters={1}
        onClear={() => {
          setSearchQuery('')
          setPendingCb(null)
        }}
        onSearch={(query, callback) => {
          setSearchQuery(query)
          setPendingCb(() => callback)
        }}
        loading={queryFlag(memosQuery, 'isLoading')}
      />
    </div>
  )
}
