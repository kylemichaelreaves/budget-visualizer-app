import type { JSX } from 'solid-js'
import { Button } from '@components/ui/button'
import { PencilIcon, PlusIcon, TrashIcon } from '@shared/icons'
import { categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeRowActions(props: {
  pathValue: string
  nodeLabel: string
  onAddChild: () => void
  onRename: () => void
  onDelete: () => void
}): JSX.Element {
  return (
    <div
      class="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
      data-testid={categoryTreeTestId('tree-actions', props.pathValue)}
    >
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-muted-foreground hover:text-foreground"
        onClick={() => props.onAddChild()}
        aria-label={`Add child to ${props.nodeLabel}`}
        data-testid={categoryTreeTestId('add-child', props.pathValue)}
      >
        <PlusIcon class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-muted-foreground hover:text-foreground"
        onClick={() => props.onRename()}
        aria-label={`Rename ${props.nodeLabel}`}
        data-testid={categoryTreeTestId('rename', props.pathValue)}
      >
        <PencilIcon class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-destructive hover:text-destructive"
        onClick={() => void props.onDelete()}
        aria-label={`Delete ${props.nodeLabel}`}
        data-testid={categoryTreeTestId('delete', props.pathValue)}
      >
        <TrashIcon class="size-3.5" />
      </Button>
    </div>
  )
}
