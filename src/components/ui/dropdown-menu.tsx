import { Content, Item, Portal, Root, Separator, Trigger } from '@kobalte/core/dropdown-menu'
import type { ParentProps } from 'solid-js'
import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

function DropdownMenu(props: Parameters<typeof Root>[0]) {
  return <Root gutter={6} {...props} />
}

function DropdownMenuTrigger(props: Parameters<typeof Trigger>[0] & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <Trigger
      class={cn(
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md',
        props.class,
      )}
      {...rest}
    />
  )
}

type ContentProps = ParentProps<{
  class?: string
}>

function DropdownMenuContent(props: ContentProps) {
  const rest = omit(props, 'class', 'children')
  return (
    <Portal>
      <Content
        class={cn(
          'data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md',
          props.class,
        )}
        {...rest}
      >
        {props.children}
      </Content>
    </Portal>
  )
}

function DropdownMenuItem(props: Parameters<typeof Item>[0] & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <Item
      class={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors',
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
        props.class,
      )}
      {...rest}
    />
  )
}

function DropdownMenuSeparator(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <Separator class={cn('-mx-1 my-1 h-px bg-border', props.class)} {...rest} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
