import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { ChevronDownIcon, ChevronRightIcon, DotIcon } from '@shared/icons'
import { cn } from '@utils/cn'
import { categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeExpandToggle(props: {
  pathValue: string
  hasChildren: boolean
  expanded: boolean
  onToggle: () => void
  /** When true, click handler calls stopPropagation before onToggle. */
  stopPropagation?: boolean
  /** 'dot' (default) shows a DotIcon for leaves; 'blank' renders an empty spacer. */
  leafSpacer?: 'dot' | 'blank'
  buttonClass?: string
  leafClass?: string
  /** Override the default aria-label which includes pathValue. */
  ariaLabel?: string
}): JSX.Element {
  const leafMode = () => props.leafSpacer ?? 'dot'

  return (
    <Show
      when={props.hasChildren}
      fallback={
        <span
          class={cn(
            'flex items-center justify-center shrink-0 text-muted-foreground',
            leafMode() === 'dot' ? 'size-5' : 'w-7 h-7',
            props.leafClass,
          )}
          aria-hidden="true"
        >
          <Show when={leafMode() === 'dot'}>
            <DotIcon class="size-3" />
          </Show>
        </span>
      }
    >
      <button
        type="button"
        class={cn(
          'flex items-center justify-center shrink-0 rounded text-muted-foreground transition-colors cursor-pointer',
          props.buttonClass ?? 'size-5 hover:bg-accent',
        )}
        onClick={(e) => {
          if (props.stopPropagation) e.stopPropagation()
          props.onToggle()
        }}
        aria-label={props.ariaLabel ?? `${props.expanded ? 'Collapse' : 'Expand'} ${props.pathValue}`}
        data-testid={categoryTreeTestId('tree-toggle', props.pathValue)}
      >
        <Show when={props.expanded} fallback={<ChevronRightIcon class="size-3.5" />}>
          <ChevronDownIcon class="size-3.5" />
        </Show>
      </button>
    </Show>
  )
}
