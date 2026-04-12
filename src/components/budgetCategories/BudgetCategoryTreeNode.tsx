import type { JSX } from 'solid-js'
import { For, Show, createSignal } from 'solid-js'
import { BUDGET_CATEGORY_PATH_DELIMITER } from '@api/helpers/convertToTree'
import type { CategoryNode } from '@types'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import BudgetCategoryInlineAddForm from './BudgetCategoryInlineAddForm'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DotIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from './budgetCategoryIcons'
import type { BudgetCategoryOperation } from './mutateBudgetCategory'
import { budgetCategorySegmentValidationError, categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeNode(props: {
  node: CategoryNode
  depth: number
  onMutate: (op: BudgetCategoryOperation) => Promise<void>
  mutatingPaths: Set<string>
}): JSX.Element {
  const children = () => props.node.children ?? []
  const hasChildren = () => children().length > 0
  const pad = () => Math.min(props.depth, 12) * 20

  const [expanded, setExpanded] = createSignal(true)
  const [renaming, setRenaming] = createSignal(false)
  const [renameValue, setRenameValue] = createSignal('')
  const [renameError, setRenameError] = createSignal<string | null>(null)
  const [addingChild, setAddingChild] = createSignal(false)

  const isMutating = () => props.mutatingPaths.has(props.node.value)
  const pathSegments = () => props.node.value.split(BUDGET_CATEGORY_PATH_DELIMITER)

  const startRename = () => {
    setRenameValue(props.node.label)
    setRenameError(null)
    setRenaming(true)
  }

  const confirmRename = async () => {
    const newName = renameValue().trim()
    if (!newName || newName === props.node.label) {
      setRenaming(false)
      return
    }
    const err = budgetCategorySegmentValidationError(newName)
    if (err) {
      setRenameError(err)
      return
    }
    setRenameError(null)
    await props.onMutate({ operation: 'rename', path: pathSegments(), newName })
    setRenaming(false)
  }

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      void confirmRename()
    } else if (e.key === 'Escape') {
      setRenameError(null)
      setRenaming(false)
    }
  }

  const handleAddChild = async (name: string) => {
    await props.onMutate({ operation: 'add', path: pathSegments(), name })
    setAddingChild(false)
    setExpanded(true)
  }

  const handleDelete = async () => {
    await props.onMutate({ operation: 'delete', path: pathSegments() })
  }

  return (
    <li class="list-none" data-testid={`budget-category-node-${props.depth}`}>
      <div
        class="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-accent/50 group"
        style={{ 'padding-left': `${pad() + 6}px` }}
        data-testid={categoryTreeTestId('tree-row', props.node.value)}
      >
        <Show
          when={hasChildren()}
          fallback={
            <span class="flex items-center justify-center size-5 shrink-0 text-muted-foreground">
              <DotIcon class="size-3" />
            </span>
          }
        >
          <button
            type="button"
            class="flex items-center justify-center size-5 shrink-0 rounded hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded() ? 'Collapse' : 'Expand'}
            data-testid={categoryTreeTestId('tree-toggle', props.node.value)}
          >
            <Show when={expanded()} fallback={<ChevronRightIcon class="size-3.5" />}>
              <ChevronDownIcon class="size-3.5" />
            </Show>
          </button>
        </Show>

        <Show
          when={!renaming()}
          fallback={
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <div class="flex items-center gap-1">
                <Input
                  type="text"
                  value={renameValue()}
                  onInput={(e) => {
                    setRenameValue(e.currentTarget.value)
                    setRenameError(null)
                  }}
                  onKeyDown={handleRenameKeyDown}
                  autofocus
                  class="h-7 text-sm flex-1 min-w-[80px]"
                  data-testid={categoryTreeTestId('rename-input', props.node.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-green-600 hover:text-green-700"
                  disabled={!renameValue().trim()}
                  onClick={() => void confirmRename()}
                  aria-label="Confirm rename"
                  data-testid={categoryTreeTestId('rename-confirm', props.node.value)}
                >
                  <CheckIcon class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setRenameError(null)
                    setRenaming(false)
                  }}
                  aria-label="Cancel rename"
                  data-testid={categoryTreeTestId('rename-cancel', props.node.value)}
                >
                  <XIcon class="size-3.5" />
                </Button>
              </div>
              <Show when={renameError()}>
                {(msg) => (
                  <p
                    class="text-destructive text-xs m-0"
                    role="alert"
                    data-testid={categoryTreeTestId('rename-validation-error', props.node.value)}
                  >
                    {msg()}
                  </p>
                )}
              </Show>
            </div>
          }
        >
          <span
            class="text-sm font-medium truncate flex-1 min-w-0"
            classList={{ 'opacity-50': isMutating() }}
          >
            {props.node.label}
          </span>
        </Show>

        <Show when={!renaming() && !isMutating()}>
          <div
            class="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
            data-testid={categoryTreeTestId('tree-actions', props.node.value)}
          >
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setAddingChild(true)}
              aria-label={`Add child to ${props.node.label}`}
              data-testid={categoryTreeTestId('add-child', props.node.value)}
            >
              <PlusIcon class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-muted-foreground hover:text-foreground"
              onClick={startRename}
              aria-label={`Rename ${props.node.label}`}
              data-testid={categoryTreeTestId('rename', props.node.value)}
            >
              <PencilIcon class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-destructive hover:text-destructive"
              onClick={() => void handleDelete()}
              aria-label={`Delete ${props.node.label}`}
              data-testid={categoryTreeTestId('delete', props.node.value)}
            >
              <TrashIcon class="size-3.5" />
            </Button>
          </div>
        </Show>
      </div>

      <Show when={addingChild()}>
        <div style={{ 'padding-left': `${pad() + 26}px` }}>
          <BudgetCategoryInlineAddForm
            placeholder={`New subcategory of ${props.node.label}...`}
            onSubmit={(name) => handleAddChild(name)}
            onCancel={() => setAddingChild(false)}
            data-testid={categoryTreeTestId('add-child-form', props.node.value)}
          />
        </div>
      </Show>

      <Show when={hasChildren() && expanded()}>
        <ul class="m-0 p-0">
          <For each={children()}>
            {(child) => (
              <BudgetCategoryTreeNode
                node={child}
                depth={props.depth + 1}
                onMutate={props.onMutate}
                mutatingPaths={props.mutatingPaths}
              />
            )}
          </For>
        </ul>
      </Show>
    </li>
  )
}
