import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <div data-slot="skeleton" class={cn('bg-accent animate-pulse rounded-md', props.class)} {...rest} />
}

export { Skeleton }
