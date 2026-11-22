import { type ParentProps, createContext, omit, useContext } from 'solid-js'
import * as ToggleGroupPrimitive from '@kobalte/core/toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@utils/cn'

const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: 'default',
  variant: 'default',
})

type ToggleGroupSingleProps = ParentProps<{
  class?: string
  variant?: VariantProps<typeof toggleVariants>['variant']
  size?: VariantProps<typeof toggleVariants>['size']
  value?: string | null
  defaultValue?: string
  onChange?: (value: string | null) => void
  multiple?: false
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
}>

type ToggleGroupMultipleProps = ParentProps<{
  class?: string
  variant?: VariantProps<typeof toggleVariants>['variant']
  size?: VariantProps<typeof toggleVariants>['size']
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  multiple: true
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
}>

type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps

function ToggleGroup(props: ToggleGroupProps) {
  const rest = omit(props, 'class', 'variant', 'size', 'children')
  /** Getters so reads of `props.*` happen when consumers access context (tracked). */
  const contextValue: ToggleGroupContextValue = {
    get variant() {
      return props.variant ?? 'default'
    },
    get size() {
      return props.size ?? 'default'
    },
  }
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={props.variant ?? 'default'}
      data-size={props.size ?? 'default'}
      class={cn(
        'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
        props.class,
      )}
      {...rest}
    >
      <ToggleGroupContext value={contextValue}>{props.children}</ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
  )
}

type ToggleGroupItemProps = ToggleGroupPrimitive.ToggleGroupItemProps &
  VariantProps<typeof toggleVariants> & {
    class?: string
  }

function ToggleGroupItem(props: ToggleGroupItemProps) {
  const rest = omit(props, 'class', 'variant', 'size', 'children')
  const context = useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={props.variant ?? context.variant}
      data-size={props.size ?? context.size}
      class={cn(
        toggleVariants({
          variant: props.variant ?? context.variant,
          size: props.size ?? context.size,
        }),
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
        props.class,
      )}
      {...rest}
    >
      {props.children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem, toggleVariants }
