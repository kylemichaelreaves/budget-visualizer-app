import type { JSX } from 'solid-js'
import { createMemo, createSignal, onCleanup, Show } from 'solid-js'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from '@components/ui/combobox'

export type AutocompleteOption = { value: string; label: string }

const SEARCH_DEBOUNCE_MS = 450
const MAX_SUGGESTIONS = 50

/**
 * Typeahead built on Kobalte's Combobox.
 *
 * The public props are unchanged from the hand-rolled version this replaces, so
 * call sites did not move. What changed is underneath: the old implementation
 * rendered `<div role="option">` rows inside a plain popover with a
 * manually-tracked highlight index and a `document` click listener. Those divs
 * were not focusable and the input advertised none of the relationship —
 * no `aria-expanded`, `aria-controls`, or `aria-activedescendant` — so assistive
 * technology had no way to know a listbox existed or which row was current.
 * Kobalte owns all of that, plus dismiss behaviour and portalling.
 */
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
  /** Fires when the text input loses focus (e.g. commit free-text). */
  onInputBlur?: () => void
  /** Fires on Enter when there are no suggestions (e.g. commit typed filter text). */
  onEnterNoSuggestions?: () => void
}): JSX.Element {
  const [query, setQuery] = createSignal('')
  const [asyncSuggestions, setAsyncSuggestions] = createSignal<AutocompleteOption[]>([])

  const minChars = () => props.minCharacters ?? 0

  let debounceId: ReturnType<typeof setTimeout> | undefined

  function scheduleFetch(q: string) {
    if (debounceId) clearTimeout(debounceId)
    debounceId = setTimeout(() => {
      debounceId = undefined
      props.onSearch?.(q, setAsyncSuggestions)
    }, SEARCH_DEBOUNCE_MS)
  }

  onCleanup(() => {
    if (debounceId) clearTimeout(debounceId)
  })

  /** Server-driven when `onSearch` is supplied; otherwise filter the given options. */
  const suggestions = createMemo(() => {
    if (props.onSearch) return asyncSuggestions().slice(0, MAX_SUGGESTIONS)
    const q = query().trim()
    if (!q || q.length < minChars()) return (props.options ?? []).slice(0, MAX_SUGGESTIONS)
    const lowered = q.toLowerCase()
    return (props.options ?? [])
      .filter((option) => option.label.toLowerCase().includes(lowered))
      .slice(0, MAX_SUGGESTIONS)
  })

  /** Show the human label for a committed value, falling back to the raw value. */
  const selectedOption = createMemo<AutocompleteOption | null>(() => {
    if (!props.value) return null
    const hit = props.options.find((o) => o.value === props.value)
    return hit ?? { value: props.value, label: props.value }
  })

  function clear() {
    setQuery('')
    setAsyncSuggestions([])
    props.onChange('')
    props.onClear?.()
  }

  return (
    <div class="relative w-full" data-testid={props.dataTestId}>
      <Combobox<AutocompleteOption>
        options={suggestions()}
        optionValue="value"
        optionTextValue="label"
        optionLabel="label"
        value={selectedOption()}
        disabled={props.disabled}
        placeholder={props.placeholder}
        // Preserves the previous behaviour of showing suggestions as soon as the
        // field is focused, rather than only once the user types.
        triggerMode="focus"
        // Kobalte filters internally by default; suggestions are already filtered
        // (or server-supplied), so pass them straight through.
        onInputChange={(v) => {
          setQuery(v)
          props.onChange(v)
          scheduleFetch(v)
        }}
        onChange={(option) => {
          if (!option) return
          props.onChange(option.value)
          setQuery('')
        }}
        itemComponent={(itemProps) => (
          <ComboboxItem item={itemProps.item}>{itemProps.item.rawValue.label}</ComboboxItem>
        )}
      >
        <ComboboxControl>
          <ComboboxInput
            aria-label={props.ariaLabel || props.placeholder}
            class={props.value ? 'pr-14' : 'pr-8'}
            onBlur={() => props.onInputBlur?.()}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key !== 'Enter') return

              // Enter with nothing to pick commits the typed text (free-text filter).
              if (suggestions().length === 0) {
                if (!props.onEnterNoSuggestions) return
                e.preventDefault()
                props.onEnterNoSuggestions()
                setQuery('')
                return
              }

              /**
               * Preserve "Enter picks the first suggestion" from the previous
               * implementation. Kobalte does not highlight an option on open, so
               * without this, Enter would do nothing until the user arrowed down —
               * a regression for the memo filter, which is typed into constantly.
               *
               * `aria-activedescendant` is Kobalte's own record of the current
               * option, so an empty value means the user has not moved the cursor
               * and Kobalte will not act on this Enter itself.
               */
              const input = e.currentTarget as HTMLInputElement | null
              if (input?.getAttribute('aria-activedescendant')) return

              const first = suggestions()[0]
              if (!first) return
              e.preventDefault()
              props.onChange(first.value)
              setQuery('')
            }}
          />
          <Show when={props.value && !props.disabled}>
            <button
              type="button"
              class="absolute right-8 flex size-5 items-center justify-center rounded-full border-none bg-transparent text-base leading-none text-muted-foreground hover:text-foreground"
              aria-label="Clear"
              onClick={(ev) => {
                ev.stopPropagation()
                clear()
              }}
            >
              ×
            </button>
          </Show>
          <ComboboxTrigger aria-label={props.placeholder} />
        </ComboboxControl>

        <Show when={!props.disabled}>
          <Show
            when={!props.loading}
            fallback={
              <div class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
                {props.loadingText ?? 'Loading...'}
              </div>
            }
          >
            <ComboboxContent />
          </Show>
        </Show>
      </Combobox>
    </div>
  )
}
