import { type JSX, splitProps } from 'solid-js'
import { cn } from '@utils/cn'

type SeparatorProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, ['class', 'orientation', 'decorative'])
  const orientation = () => local.orientation ?? 'horizontal'

  return (
    <div
      data-slot="separator-root"
      role={local.decorative ? 'none' : 'separator'}
      aria-orientation={local.decorative ? undefined : orientation()}
      data-orientation={orientation()}
      class={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        local.class,
      )}
      {...rest}
    />
  )
}

export { Separator }
export type { SeparatorProps }
