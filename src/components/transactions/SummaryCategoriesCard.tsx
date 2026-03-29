import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

export default function SummaryCategoriesCard(props: { categories: [string, number][] }): JSX.Element {
  return (
    <Card data-testid="summary-categories-card">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">By Budget Category</CardTitle>
        <svg
          class="size-4 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </CardHeader>
      <CardContent class="pb-3">
        <Show
          when={props.categories.length > 0}
          fallback={<p class="text-xs text-muted-foreground">No categorised expenses</p>}
        >
          <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            <For each={props.categories}>
              {([cat, amt]) => (
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="size-2 rounded-full shrink-0 bg-muted-foreground" />
                    <span class="truncate text-muted-foreground">{cat}</span>
                  </div>
                  <span class="shrink-0 font-medium">${amt.toFixed(2)}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </CardContent>
    </Card>
  )
}
