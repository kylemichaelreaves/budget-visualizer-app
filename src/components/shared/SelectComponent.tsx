import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'

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
    <div class="relative w-full" ref={(el) => (root = el)} data-testid={props.dataTestId || undefined}>
      <div class="flex items-center gap-1.5">
        <input
          class="w-full rounded-md border border-border bg-input px-2.5 py-2 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-55"
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
            class="cursor-pointer border-none bg-transparent px-2 py-1 text-base leading-none text-muted-foreground"
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
        <div
          class="absolute left-0 right-0 top-full z-40 mt-1 max-h-[220px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
          role="listbox"
        >
          <Show when={props.loading}>
            <div class="px-3 py-2.5 text-sm text-muted-foreground">{props.loadingText ?? 'Loading...'}</div>
          </Show>
          <Show when={!props.loading}>
            <For each={filtered()}>
              {(option) => (
                <div
                  class="cursor-pointer px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                  classList={{ 'bg-accent/50': option.value === props.selectedValue }}
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
