import type { Component, JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

interface AuthSuccessScreenProps {
  icon: Component<{ class?: string }>
  title: string
  description: string | JSX.Element
  tip?: { label: string; text: string | JSX.Element }
  children?: JSX.Element
}

export function AuthSuccessScreen(props: AuthSuccessScreenProps) {
  return (
    <div class="flex flex-col items-center text-center gap-5 px-1">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
        <Dynamic component={props.icon} class="h-8 w-8 text-emerald-500" />
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="text-foreground text-xl font-semibold">{props.title}</h2>
        <p class="text-muted-foreground leading-relaxed max-w-xs mx-auto text-[15px]">{props.description}</p>
      </div>

      {props.tip && (
        <div class="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left w-full">
          <p class="text-muted-foreground text-[13px]">
            <span class="font-medium text-foreground">{props.tip.label}</span> {props.tip.text}
          </p>
        </div>
      )}

      {props.children}
    </div>
  )
}
