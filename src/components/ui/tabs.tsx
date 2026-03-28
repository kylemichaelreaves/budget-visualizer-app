import { splitProps } from 'solid-js'
import * as TabsPrimitive from '@kobalte/core/tabs'
import { cn } from '@utils/cn'

type TabsProps = TabsPrimitive.TabsRootProps & { class?: string }

function Tabs(props: TabsProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TabsPrimitive.Root data-slot="tabs" class={cn('flex flex-col gap-2', local.class)} {...rest} />
  )
}

type TabsListProps = TabsPrimitive.TabsListProps & { class?: string }

function TabsList(props: TabsListProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      class={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px]',
        local.class,
      )}
      {...rest}
    />
  )
}

type TabsTriggerProps = TabsPrimitive.TabsTriggerProps & { class?: string }

function TabsTrigger(props: TabsTriggerProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      class={cn(
        'data-[selected]:bg-card dark:data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[selected]:border-input dark:data-[selected]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        local.class,
      )}
      {...rest}
    />
  )
}

type TabsContentProps = TabsPrimitive.TabsContentProps & { class?: string }

function TabsContent(props: TabsContentProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TabsPrimitive.Content data-slot="tabs-content" class={cn('flex-1 outline-none', local.class)} {...rest} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
