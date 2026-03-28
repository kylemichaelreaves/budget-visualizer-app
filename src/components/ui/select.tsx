import { type JSX, type ParentProps, splitProps } from 'solid-js'
import * as SelectPrimitive from '@kobalte/core/select'
import { cn } from '@utils/cn'

function Select<T extends string | object>(props: SelectPrimitive.SelectRootProps<T>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

type SelectTriggerProps = ParentProps<
  { class?: string; size?: 'sm' | 'default' } & Omit<SelectPrimitive.SelectTriggerProps, 'children'>
>

function SelectTrigger(props: SelectTriggerProps) {
  const [local, rest] = splitProps(props, ['class', 'size', 'children'])
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={local.size ?? 'default'}
      class={cn(
        'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        local.class,
      )}
      {...rest}
    >
      {local.children}
      <SelectPrimitive.Icon class="size-4 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue<T extends string | object>(props: SelectPrimitive.SelectValueProps<T>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

type SelectContentProps = { class?: string } & Omit<SelectPrimitive.SelectContentProps, 'children'>

function SelectContent(props: SelectContentProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        class={cn(
          'bg-popover text-popover-foreground data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
          local.class,
        )}
        {...rest}
      >
        <SelectPrimitive.Listbox class="p-1" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

type SelectItemProps = ParentProps<
  { class?: string } & Omit<SelectPrimitive.SelectItemProps, 'children'>
>

function SelectItem(props: SelectItemProps) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      class={cn(
        'focus:bg-accent focus:text-accent-foreground [&_svg:not([class*="text-"])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        local.class,
      )}
      {...rest}
    >
      <span class="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
    </SelectPrimitive.Item>
  )
}

function SelectLabel(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      class={cn('text-muted-foreground px-2 py-1.5 text-xs', local.class)}
      {...rest}
    />
  )
}

function SelectSeparator(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <div
      data-slot="select-separator"
      class={cn('bg-border pointer-events-none -mx-1 my-1 h-px', local.class)}
      {...rest}
    />
  )
}

export { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
