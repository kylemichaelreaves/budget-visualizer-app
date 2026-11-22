import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

type LabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement> & { class?: string }

function Label(props: LabelProps) {
  const rest = omit(props, 'class')
  return (
    <label
      data-slot="label"
      class={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        props.class,
      )}
      {...rest}
    />
  )
}

export { Label }
export type { LabelProps }
