import { type ParentProps, splitProps } from 'solid-js'
import * as ComboboxPrimitive from '@kobalte/core/combobox'
import { cn } from '@utils/cn'

/**
 * Kobalte-backed combobox (text input + filtered listbox).
 *
 * Prefer this over hand-rolling a popover of `<div role="option">`: Kobalte owns
 * the input/listbox wiring that a hand-built version reliably gets wrong —
 * `aria-expanded`, `aria-controls`, `aria-activedescendant`, roving focus,
 * type-ahead, and dismiss behaviour. For a fixed set of choices prefer a native
 * `<select>` or `ui/select`; a combobox is for when the user types to filter.
 *
 * `Combobox` and `ComboboxControl` are re-exported unstyled — they carry the
 * option-type generic, and wrapping them would only obscure it. The styled parts
 * below are the ones with visual decisions in them.
 */
const Combobox = ComboboxPrimitive.Root
const ComboboxControl = ComboboxPrimitive.Control

function ComboboxInput(props: ComboboxPrimitive.ComboboxInputProps & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      class={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-input-background px-3 py-1.5 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...rest}
    />
  )
}

function ComboboxTrigger(props: ComboboxPrimitive.ComboboxTriggerProps & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      class={cn(
        'absolute right-1.5 flex size-6 items-center justify-center rounded border-none bg-transparent text-muted-foreground hover:text-foreground',
        local.class,
      )}
      {...rest}
    >
      <ComboboxPrimitive.Icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </ComboboxPrimitive.Icon>
    </ComboboxPrimitive.Trigger>
  )
}

/** Popover + listbox. `Portal` keeps it clear of ancestor `overflow: hidden`. */
function ComboboxContent(props: { class?: string }) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Content
        data-slot="combobox-content"
        class={cn(
          'bg-popover text-popover-foreground z-50 max-h-[220px] min-w-(--kb-popper-anchor-width) overflow-y-auto rounded-md border border-border shadow-lg',
          props.class,
        )}
      >
        <ComboboxPrimitive.Listbox class="p-1" />
      </ComboboxPrimitive.Content>
    </ComboboxPrimitive.Portal>
  )
}

type ComboboxItemProps = ParentProps<{ class?: string } & ComboboxPrimitive.ComboboxItemOptions>

/**
 * One option row. Kobalte supplies `role="option"`, `aria-selected`, and focus
 * management; `data-highlighted` is its keyboard/pointer cursor.
 */
function ComboboxItem(props: ComboboxItemProps) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      class={cn(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        local.class,
      )}
      {...rest}
    >
      <ComboboxPrimitive.ItemLabel>{local.children}</ComboboxPrimitive.ItemLabel>
    </ComboboxPrimitive.Item>
  )
}

export { Combobox, ComboboxControl, ComboboxInput, ComboboxTrigger, ComboboxContent, ComboboxItem }
