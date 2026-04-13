import type { Accessor, JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import type { CategoryNode } from '@types'
import { CheckIcon } from '@shared/icons'
import BudgetCategoryTreeExpandToggle from '@components/budgetCategories/BudgetCategoryTreeExpandToggle'

export default function CategoryTreeNodeRow(props: {
  node: CategoryNode
  depth: number
  selected: string
  expanded: Set<string>
  highlighted: number
  treeNavIndexByValue: Accessor<Map<string, number>>
  onToggle: (value: string) => void
  onSelect: (value: string) => void
  onHighlight: (index: number) => void
}): JSX.Element {
  const hasChildren = () => (props.node.children?.length ?? 0) > 0
  const isOpen = () => props.expanded.has(props.node.value)
  const isSelected = () => props.selected === props.node.value
  const navIndex = () => props.treeNavIndexByValue().get(props.node.value) ?? -1
  const isHighlighted = () => props.highlighted === navIndex()

  return (
    <>
      <div
        data-highlight={isHighlighted()}
        style={{ 'padding-left': `${props.depth * 18 + 10}px` }}
        onMouseEnter={() => props.onHighlight(navIndex())}
        class={`w-full flex items-center gap-1 py-1.5 pr-3 rounded-md text-sm transition-colors ${
          isHighlighted()
            ? 'bg-accent text-accent-foreground'
            : isSelected()
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground'
        }`}
      >
        <BudgetCategoryTreeExpandToggle
          pathValue={props.node.value}
          hasChildren={hasChildren()}
          expanded={isOpen()}
          onToggle={() => props.onToggle(props.node.value)}
          stopPropagation
          leafSpacer="blank"
          buttonClass="size-7 rounded-md hover:bg-muted/80 hover:text-foreground"
          ariaLabel={isOpen() ? 'Collapse category' : 'Expand category'}
        />
        <button
          type="button"
          aria-current={isSelected() ? 'true' : undefined}
          class="flex-1 min-w-0 flex items-center gap-2 py-0.5 text-left rounded-md"
          onClick={() => props.onSelect(props.node.value)}
        >
          <span class="flex-1 truncate">{props.node.label}</span>
          <Show when={isSelected()}>
            <CheckIcon class="size-3.5 shrink-0 text-primary" />
          </Show>
        </button>
      </div>

      <Show when={hasChildren() && isOpen()}>
        <For each={props.node.children!}>
          {(child) => (
            <CategoryTreeNodeRow
              node={child}
              depth={props.depth + 1}
              selected={props.selected}
              expanded={props.expanded}
              highlighted={props.highlighted}
              treeNavIndexByValue={props.treeNavIndexByValue}
              onToggle={props.onToggle}
              onSelect={props.onSelect}
              onHighlight={props.onHighlight}
            />
          )}
        </For>
      </Show>
    </>
  )
}
