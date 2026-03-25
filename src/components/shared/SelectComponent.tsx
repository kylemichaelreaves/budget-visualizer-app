import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import './shared-ui.css'

export default function SelectComponent(props: {
  options: { value: string; label: string }[]
  selectedValue: string
  placeholder: string
  disabled?: boolean
  onChange: (selectedValue: string) => void
  onClear?: (selectedValue: string) => void
  loading?: boolean
  loadingText?: string
  dataTestId?: string
  ariaLabel?: string
}): JSX.Element {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')

  const selectedLabel = createMemo(() => {
    const v = props.selectedValue
    const hit = props.options.find((o) => o.value === v)
    return hit?.label ?? ''
  })

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    if (!q) return props.options
    return props.options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  })

  let root: HTMLDivElement | undefined

  onMount(() => {
    function onDocClick(e: MouseEvent) {
      if (root && !root.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('click', onDocClick)
    onCleanup(() => document.removeEventListener('click', onDocClick))
  })

  return (
    <div class="bv-select-combobox" ref={(el) => (root = el)} data-testid={props.dataTestId || undefined}>
      <div style={{ display: 'flex', gap: '6px', 'align-items': 'center' }}>
        <input
          class="bv-select-input"
          type="text"
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-label={props.ariaLabel || props.placeholder}
          value={open() ? query() : selectedLabel()}
          onFocus={() => {
            setOpen(true)
            setQuery(selectedLabel())
          }}
          onInput={(e) => {
            setQuery(e.currentTarget.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setQuery('')
            }
          }}
        />
        <Show when={props.selectedValue && !props.disabled}>
          <button
            type="button"
            class="bv-autocomplete-clear"
            aria-label="Clear"
            onClick={(ev) => {
              ev.stopPropagation()
              props.onChange('')
              props.onClear?.('')
              setQuery('')
              setOpen(false)
            }}
          >
            ×
          </button>
        </Show>
      </div>
      <Show when={open() && !props.disabled}>
        <div class="bv-select-dropdown" role="listbox">
          <Show when={props.loading}>
            <div class="bv-autocomplete-loading">{props.loadingText ?? 'Loading...'}</div>
          </Show>
          <Show when={!props.loading}>
            <For each={filtered()}>
              {(option) => (
                <div
                  class="bv-select-option"
                  classList={{ 'bv-select-option-selected': option.value === props.selectedValue }}
                  role="option"
                  aria-selected={option.value === props.selectedValue}
                  data-testid={`option-${option.value}`}
                  onClick={() => {
                    props.onChange(option.value)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {option.label}
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  )
}
