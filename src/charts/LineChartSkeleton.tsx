import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { Skeleton } from '@components/ui/skeleton'

/** Placeholder sized like a `LineChart`: the plot area over a row of axis labels. */
export default function LineChartSkeleton(props: { dataTestId?: string; class?: string }): JSX.Element {
  return (
    <div class={`flex flex-col gap-2 ${props.class ?? ''}`} data-testid={props.dataTestId}>
      <Skeleton class="h-[240px] w-full rounded-lg" />
      <div class="flex justify-between px-2">
        <For each={[0, 1, 2, 3]}>{() => <Skeleton class="h-3 w-12" />}</For>
      </div>
    </div>
  )
}
