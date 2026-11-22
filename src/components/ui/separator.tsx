import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

type SeparatorProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

function Separator(props: SeparatorProps) {
  const rest = omit(props, 'class', 'orientation', 'decorative')
  const orientation = () => props.orientation ?? 'horizontal'

  return (
    <div
      data-slot="separator-root"
      role={props.decorative ? 'none' : 'separator'}
      aria-orientation={props.decorative ? undefined : orientation()}
      data-orientation={orientation()}
      class={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        props.class,
      )}
      {...rest}
    />
  )
}

export { Separator }
export type { SeparatorProps }
