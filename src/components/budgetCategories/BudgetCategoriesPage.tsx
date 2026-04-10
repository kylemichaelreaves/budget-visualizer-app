import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import { httpClient } from '@api/httpClient'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'
import type { CategoryNode } from '@types'

// ---------------------------------------------------------------------------
// Icons (inline SVGs matching existing codebase patterns)
// ---------------------------------------------------------------------------

function ChevronRightIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ChevronDownIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function FolderTreeIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-1.9-2.2a1 1 0 0 0-.8-.4H9a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
      <path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.88-.55H9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1Z" />
      <path d="M3 5a2 2 0 0 0 2 2h3" />
      <path d="M3 3v13a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function PlusIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function PencilIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )
}

function TrashIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function CheckIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function DotIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

type BudgetCategoryOperation =
  | { operation: 'add'; path: string[]; name: string }
  | { operation: 'rename'; path: string[]; newName: string }
  | { operation: 'delete'; path: string[] }
  | { operation: 'move'; path: string[]; newParentPath: string[] }

async function mutateBudgetCategory(body: BudgetCategoryOperation): Promise<void> {
  await httpClient.patch('/budget-categories', body)
}

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

function filterTree(nodes: CategoryNode[], q: string): CategoryNode[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return nodes

  function keep(n: CategoryNode): CategoryNode | null {
    const selfMatch = n.label.toLowerCase().includes(needle) || n.value.toLowerCase().includes(needle)
    const kids = n.children?.map(keep).filter((x): x is CategoryNode => x != null) ?? []
    if (selfMatch) {
      return { ...n, children: n.children }
    }
    if (kids.length > 0) {
      return { ...n, children: kids }
    }
    return null
  }

  return nodes.map(keep).filter((x): x is CategoryNode => x != null)
}

// ---------------------------------------------------------------------------
// Inline add form
// ---------------------------------------------------------------------------

function InlineAddForm(props: {
  placeholder: string
  onSubmit: (name: string) => void | Promise<void>
  onCancel: () => void
  'data-testid'?: string
}): JSX.Element {
  const [name, setName] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  const handleSubmit = async () => {
    const trimmed = name().trim()
    if (!trimmed || submitting()) return
    setSubmitting(true)
    try {
      await Promise.resolve(props.onSubmit(trimmed))
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSubmit()
    } else if (e.key === 'Escape') {
      props.onCancel()
    }
  }

  return (
    <div class="flex items-center gap-1.5 py-1" data-testid={props['data-testid']}>
      <Input
        type="text"
        placeholder={props.placeholder}
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting()}
        autofocus
        class="h-7 text-sm flex-1 min-w-[120px]"
        data-testid="inline-add-input"
      />
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-green-600 hover:text-green-700"
        disabled={!name().trim() || submitting()}
        onClick={() => void handleSubmit()}
        aria-label="Confirm add"
        data-testid="inline-add-confirm"
      >
        <CheckIcon class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-muted-foreground hover:text-foreground"
        onClick={props.onCancel}
        aria-label="Cancel add"
        data-testid="inline-add-cancel"
      >
        <XIcon class="size-3.5" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tree node component
// ---------------------------------------------------------------------------

function TreeNode(props: {
  node: CategoryNode
  depth: number
  onMutate: (op: BudgetCategoryOperation) => Promise<void>
  mutatingPaths: Set<string>
}): JSX.Element {
  const children = () => props.node.children ?? []
  const hasChildren = () => children().length > 0
  const pad = () => Math.min(props.depth, 12) * 20

  const [expanded, setExpanded] = createSignal(true)
  const [hovered, setHovered] = createSignal(false)
  const [renaming, setRenaming] = createSignal(false)
  const [renameValue, setRenameValue] = createSignal('')
  const [addingChild, setAddingChild] = createSignal(false)

  const isMutating = () => props.mutatingPaths.has(props.node.value)
  const pathSegments = () => props.node.value.split(' - ')

  // Rename handlers
  const startRename = () => {
    setRenameValue(props.node.label)
    setRenaming(true)
  }

  const confirmRename = async () => {
    const newName = renameValue().trim()
    if (!newName || newName === props.node.label) {
      setRenaming(false)
      return
    }
    await props.onMutate({ operation: 'rename', path: pathSegments(), newName })
    setRenaming(false)
  }

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      void confirmRename()
    } else if (e.key === 'Escape') {
      setRenaming(false)
    }
  }

  // Add child handler
  const handleAddChild = async (name: string) => {
    await props.onMutate({ operation: 'add', path: pathSegments(), name })
    setAddingChild(false)
    setExpanded(true)
  }

  // Delete handler
  const handleDelete = async () => {
    await props.onMutate({ operation: 'delete', path: pathSegments() })
  }

  return (
    <li class="list-none" data-testid={`budget-category-node-${props.depth}`}>
      <div
        class="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-accent/50 group"
        style={{ 'padding-left': `${pad() + 6}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-testid={`tree-row-${props.node.label}`}
      >
        {/* Expand / collapse toggle or leaf dot */}
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
            data-testid={`tree-toggle-${props.node.label}`}
          >
            <Show when={expanded()} fallback={<ChevronRightIcon class="size-3.5" />}>
              <ChevronDownIcon class="size-3.5" />
            </Show>
          </button>
        </Show>

        {/* Name or inline rename input */}
        <Show
          when={!renaming()}
          fallback={
            <div class="flex items-center gap-1 flex-1 min-w-0">
              <Input
                type="text"
                value={renameValue()}
                onInput={(e) => setRenameValue(e.currentTarget.value)}
                onKeyDown={handleRenameKeyDown}
                autofocus
                class="h-7 text-sm flex-1 min-w-[80px]"
                data-testid="rename-input"
              />
              <Button
                variant="ghost"
                size="icon"
                class="size-7 text-green-600 hover:text-green-700"
                disabled={!renameValue().trim()}
                onClick={() => void confirmRename()}
                aria-label="Confirm rename"
                data-testid="rename-confirm"
              >
                <CheckIcon class="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setRenaming(false)}
                aria-label="Cancel rename"
                data-testid="rename-cancel"
              >
                <XIcon class="size-3.5" />
              </Button>
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

        {/* Action buttons (visible on hover, hidden during rename) */}
        <Show when={hovered() && !renaming() && !isMutating()}>
          <div
            class="flex items-center gap-0.5 shrink-0 ml-auto"
            data-testid={`tree-actions-${props.node.label}`}
          >
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setAddingChild(true)}
              aria-label={`Add child to ${props.node.label}`}
              data-testid={`add-child-${props.node.label}`}
            >
              <PlusIcon class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-muted-foreground hover:text-foreground"
              onClick={startRename}
              aria-label={`Rename ${props.node.label}`}
              data-testid={`rename-${props.node.label}`}
            >
              <PencilIcon class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-destructive hover:text-destructive"
              onClick={() => void handleDelete()}
              aria-label={`Delete ${props.node.label}`}
              data-testid={`delete-${props.node.label}`}
            >
              <TrashIcon class="size-3.5" />
            </Button>
          </div>
        </Show>
      </div>

      {/* Inline add child form */}
      <Show when={addingChild()}>
        <div style={{ 'padding-left': `${pad() + 26}px` }}>
          <InlineAddForm
            placeholder={`New subcategory of ${props.node.label}...`}
            onSubmit={(name) => void handleAddChild(name)}
            onCancel={() => setAddingChild(false)}
            data-testid={`add-child-form-${props.node.label}`}
          />
        </div>
      </Show>

      {/* Children */}
      <Show when={hasChildren() && expanded()}>
        <ul class="m-0 p-0">
          <For each={children()}>
            {(child) => (
              <TreeNode
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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function BudgetCategoriesPage(): JSX.Element {
  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
  )
  const queryClient = useQueryClient()

  const [filter, setFilter] = createSignal('')
  const [addingRoot, setAddingRoot] = createSignal(false)
  const [mutatingPaths, setMutatingPaths] = createSignal<Set<string>>(new Set())
  const [error, setError] = createSignal<string | null>(null)

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const data = extractBudgetCategoriesData(raw)
    if (!data || typeof data !== 'object') return [] as CategoryNode[]
    return convertToTree(data)
  })

  const visibleTree = createMemo(() => filterTree(tree(), filter()))

  const handleMutate = async (op: BudgetCategoryOperation) => {
    const pathKey = op.operation === 'add' ? [...op.path, op.name].join(' - ') : op.path.join(' - ')

    setError(null)
    setMutatingPaths((prev) => {
      const next = new Set(prev)
      next.add(pathKey)
      return next
    })

    try {
      await mutateBudgetCategory(op)
      await queryClient.invalidateQueries({ queryKey: ['budgetCategories'] })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(`Failed to ${op.operation} category: ${message}`)
    } finally {
      setMutatingPaths((prev) => {
        const next = new Set(prev)
        next.delete(pathKey)
        return next
      })
    }
  }

  const handleAddRoot = async (name: string) => {
    await handleMutate({ operation: 'add', path: [], name })
    setAddingRoot(false)
  }

  return (
    <div class="text-foreground max-w-[960px]" data-testid="budget-categories-page">
      {/* Page header */}
      <header class="mb-6">
        <h1 class="mb-1 text-2xl font-bold">Budget Management</h1>
        <p class="m-0 text-muted-foreground text-sm">
          Set spending limits and manage your category hierarchy
        </p>
      </header>

      {/* API error */}
      <Show when={q.isError && q.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="budget-categories-error"
          />
        )}
      </Show>

      {/* Mutation error */}
      <Show when={error()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Operation failed"
            message={msg()}
            dataTestId="budget-categories-mutation-error"
          />
        )}
      </Show>

      {/* Main card */}
      <Card data-testid="budget-categories-tree">
        <CardHeader>
          <div class="flex items-center gap-2">
            <FolderTreeIcon class="size-5 text-muted-foreground" />
            <CardTitle>Budget Categories</CardTitle>
          </div>
          <CardDescription>
            Edit the hierarchy used in the category selector. Hover over any row to rename, add children, or
            delete.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingRoot(true)}
              disabled={addingRoot()}
              data-testid="add-root-category-button"
            >
              <PlusIcon class="size-3.5" />
              Add Category
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {/* Filter input */}
          <div class="mb-4">
            <Input
              type="search"
              placeholder="Filter by name or path..."
              value={filter()}
              onInput={(e) => setFilter(e.currentTarget.value)}
              disabled={q.isLoading || q.isFetching}
              aria-label="Filter categories"
              data-testid="budget-categories-filter"
            />
          </div>

          {/* Loading state */}
          <Show when={q.isLoading}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-loading">
              Loading categories...
            </p>
          </Show>

          {/* Root add form */}
          <Show when={addingRoot()}>
            <div class="mb-2">
              <InlineAddForm
                placeholder="New root category..."
                onSubmit={(name) => void handleAddRoot(name)}
                onCancel={() => setAddingRoot(false)}
                data-testid="add-root-form"
              />
            </div>
          </Show>

          {/* Empty state */}
          <Show when={!q.isLoading && visibleTree().length === 0}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-empty">
              {tree().length === 0
                ? 'No categories yet. Click "Add Category" to create one.'
                : 'No categories match your filter.'}
            </p>
          </Show>

          {/* Category tree */}
          <Show when={!q.isLoading && visibleTree().length > 0}>
            <ul class="m-0 p-0">
              <For each={visibleTree()}>
                {(node) => (
                  <TreeNode node={node} depth={0} onMutate={handleMutate} mutatingPaths={mutatingPaths()} />
                )}
              </For>
            </ul>
          </Show>
        </CardContent>
      </Card>
    </div>
  )
}
