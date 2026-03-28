import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'

export type AutocompleteOption = { value: string; label: string }

export default function AutocompleteComponent(props: {
  value: string
  onChange: (value: string) => void
  options: AutocompleteOption[]
  placeholder: string
  disabled?: boolean
  onClear?: () => void
  onSearch?: (query: string, callback: (results: AutocompleteOption[]) => void) => void
  loading?: boolean
  loadingText?: string
  dataTestId?: string
  minCharacters?: number
  ariaLabel?: string
}): JSX.Element {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [asyncSuggestions, setAsyncSuggestions] = createSignal<AutocompleteOption[]>([])
  const [highlight, setHighlight] = createSignal(0)

  const minChars = () => props.minCharacters ?? 0

  let root: HTMLDivElement | undefined
  let debounceId: ReturnType<typeof setTimeout> | undefined

  function scheduleFetch(q: string) {
    if (debounceId) clearTimeout(debounceId)
    debounceId = setTimeout(() => {
      debounceId = undefined
      if (props.onSearch) {
        props.onSearch(q, (results) => {
          setAsyncSuggestions(results)
        })
        return
      }

      if (!q || q.length === 0) {
        setAsyncSuggestions((props.options ?? []).slice(0, 50))
        return
      }
      if (q.length < minChars()) {
        setAsyncSuggestions((props.options ?? []).slice(0, 50))
        return
      }
      const results =
        props.options?.filter((option) => option.label.toLowerCase().includes(q.toLowerCase())) ?? []
      setAsyncSuggestions(results.slice(0, 50))
    }, 450)
  }

  onCleanup(() => {
    if (debounceId) clearTimeout(debounceId)
  })

  const suggestions = createMemo(() => {
    if (props.onSearch) {
      return asyncSuggestions()
    }
    const q = query().trim()
    if (!q) return (props.options ?? []).slice(0, 50)
    if (q.length < minChars()) return (props.options ?? []).slice(0, 50)
    return (
      props.options?.filter((option) => option.label.toLowerCase().includes(q.toLowerCase())) ?? []
    ).slice(0, 50)
  })

  onMount(() => {
    function onDocClick(e: MouseEvent) {
      if (root && !root.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    onCleanup(() => document.removeEventListener('click', onDocClick))
  })

  const displayValue = createMemo(() => {
    if (open()) return query()
    const hit = props.options.find((o) => o.value === props.value)
    return hit?.label ?? props.value
  })

  return (
    <div class="relative w-full" data-testid={props.dataTestId} ref={(el) => (root = el)}>
      <div class="relative flex items-center">
        <input
          class="w-full rounded-md border border-input bg-input-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          type="text"
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-label={props.ariaLabel || props.placeholder}
          value={displayValue()}
          onInput={(e) => {
            const v = e.currentTarget.value
            setQuery(v)
            props.onChange(v)
            setOpen(true)
            setHighlight(0)
            scheduleFetch(v)
          }}
          onFocus={() => {
            setOpen(true)
            if (props.onSearch) {
              scheduleFetch('')
            } else {
              setQuery('')
            }
          }}
          onKeyDown={(e) => {
            const list = suggestions()
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlight((i) => Math.min(i + 1, Math.max(0, list.length - 1)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && list.length > 0) {
              e.preventDefault()
              const item = list[highlight()]
              if (item) {
                props.onChange(item.value)
                setOpen(false)
                setQuery('')
              }
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <Show when={props.value && !props.disabled}>
          <button
            type="button"
            class="absolute right-2 flex items-center justify-center size-5 rounded-full bg-transparent text-muted-foreground hover:text-foreground border-none cursor-pointer text-base leading-none"
            aria-label="Clear"
            onClick={(ev) => {
              ev.stopPropagation()
              props.onChange('')
              setQuery('')
              props.onClear?.()
            }}
          >
            ×
          </button>
        </Show>
      </div>
      <Show when={open() && !props.disabled}>
        <div
          class="absolute z-50 mt-1 w-full max-h-[220px] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
        >
          <Show when={props.loading}>
            <div class="px-3 py-2 text-sm text-muted-foreground">{props.loadingText ?? 'Loading...'}</div>
          </Show>
          <Show when={!props.loading}>
            <For each={suggestions()}>
              {(item, index) => (
                <div
                  class="cursor-default select-none px-3 py-1.5 text-sm"
                  classList={{
                    'bg-accent text-accent-foreground': index() === highlight(),
                  }}
                  role="option"
                  onMouseEnter={() => setHighlight(index())}
                  onClick={() => {
                    props.onChange(item.value)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <span>{item.label}</span>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  )
}
