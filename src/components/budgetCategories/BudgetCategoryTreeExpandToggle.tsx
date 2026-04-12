import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { ChevronDownIcon, ChevronRightIcon, DotIcon } from './icons'
import { categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeExpandToggle(props: {
  pathValue: string
  hasChildren: boolean
  expanded: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <Show
      when={props.hasChildren}
      fallback={
        <span class="flex items-center justify-center size-5 shrink-0 text-muted-foreground">
          <DotIcon class="size-3" />
        </span>
      }
    >
      <button
        type="button"
        class="flex items-center justify-center size-5 shrink-0 rounded hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
        onClick={() => props.onToggle()}
        aria-label={props.expanded ? 'Collapse' : 'Expand'}
        data-testid={categoryTreeTestId('tree-toggle', props.pathValue)}
      >
        <Show when={props.expanded} fallback={<ChevronRightIcon class="size-3.5" />}>
          <ChevronDownIcon class="size-3.5" />
        </Show>
      </button>
    </Show>
  )
}
