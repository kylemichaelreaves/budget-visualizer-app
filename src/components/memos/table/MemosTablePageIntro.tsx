import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'

export default function MemosTablePageIntro(props: {
  headerUniqueTotal: Accessor<number | null>
  headerAmbiguousCount: Accessor<number>
  headerAmbiguousPartial: Accessor<boolean>
  searchIsActive: Accessor<boolean>
}) {
  return (
    <div class="mb-4">
      <h2 class="text-foreground mt-0 text-2xl font-semibold">Memos</h2>
      <p class="text-muted-foreground text-sm">
        <Show when={props.headerUniqueTotal() != null} fallback={<span>Loading memo totals…</span>}>
          <span>
            {props.headerUniqueTotal()} unique memos
            <Show when={props.searchIsActive()}>
              <span class="text-muted-foreground font-normal"> (search results)</span>
            </Show>
          </span>
        </Show>
        <Show when={props.headerAmbiguousCount() > 0}>
          {' '}
          <span class="text-amber-600 dark:text-amber-400 font-medium">
            ({props.headerAmbiguousCount()} ambiguous
            <Show when={props.headerAmbiguousPartial()}>
              <span class="font-normal text-muted-foreground"> — loaded pages only</span>
            </Show>
            )
          </span>
        </Show>
      </p>
    </div>
  )
}
