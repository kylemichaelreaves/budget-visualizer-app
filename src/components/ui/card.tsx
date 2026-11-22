import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

function Card(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="card"
      class={cn('bg-card text-card-foreground flex flex-col gap-4 rounded-xl border', props.class)}
      {...rest}
    />
  )
}

function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="card-header"
      class={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4',
        props.class,
      )}
      {...rest}
    />
  )
}

function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement> & { class?: string }) {
  const rest = omit(props, 'class', 'children')
  return (
    <h4 data-slot="card-title" class={cn('leading-none', props.class)} {...rest}>
      {props.children}
    </h4>
  )
}

function CardDescription(props: JSX.HTMLAttributes<HTMLParagraphElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <p data-slot="card-description" class={cn('text-muted-foreground', props.class)} {...rest} />
}

function CardAction(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="card-action"
      class={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', props.class)}
      {...rest}
    />
  )
}

function CardContent(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <div data-slot="card-content" class={cn('px-6 [&:last-child]:pb-4', props.class)} {...rest} />
}

function CardFooter(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="card-footer"
      class={cn('flex items-center px-6 pb-6 [.border-t]:pt-6', props.class)}
      {...rest}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
