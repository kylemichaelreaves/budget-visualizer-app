import type { Component, JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

interface IconHeadingProps {
  icon: Component<{ class?: string; classList?: Record<string, boolean> }>
  title: string
  description: string | JSX.Element
  hasError?: boolean
}

export function IconHeading(props: IconHeadingProps) {
  return (
    <div class="flex flex-col items-center text-center gap-4">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300"
        classList={{
          'bg-destructive/10 dark:bg-destructive/20': !!props.hasError,
          'bg-primary/8 dark:bg-primary/15': !props.hasError,
        }}
      >
        <Dynamic
          component={props.icon}
          class="h-6 w-6 transition-colors duration-300"
          classList={{
            'text-destructive': !!props.hasError,
            'text-primary': !props.hasError,
          }}
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <h2 class="text-foreground text-xl font-semibold">{props.title}</h2>
        <p class="text-muted-foreground leading-relaxed text-[15px]">{props.description}</p>
      </div>
    </div>
  )
}
