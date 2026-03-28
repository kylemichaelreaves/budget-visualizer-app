import { type JSX, splitProps } from 'solid-js'
import { cn } from '@utils/cn'

function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return <div data-slot="skeleton" class={cn('bg-accent animate-pulse rounded-md', local.class)} {...rest} />
}

export { Skeleton }
