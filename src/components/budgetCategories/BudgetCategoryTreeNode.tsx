import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import type { CategoryNode } from '@types'
import BudgetCategoryInlineAddForm from './BudgetCategoryInlineAddForm'
import BudgetCategoryTreeExpandToggle from './BudgetCategoryTreeExpandToggle'
import BudgetCategoryTreeRenameEditor from './BudgetCategoryTreeRenameEditor'
import BudgetCategoryTreeRowActions from './BudgetCategoryTreeRowActions'
import { createBudgetCategoryTreeNodeState } from './createBudgetCategoryTreeNodeState'
import type { BudgetCategoryOperation } from './mutateBudgetCategory'
import { categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeNode(props: {
  node: CategoryNode
  depth: number
  onMutate: (op: BudgetCategoryOperation) => Promise<void>
  mutatingPaths: Set<string>
}): JSX.Element {
  const s = createBudgetCategoryTreeNodeState(props)

  return (
    <li class="list-none" data-testid={`budget-category-node-${props.depth}`}>
      <div
        class="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-accent/50 group"
        style={{ 'padding-left': `${s.pad() + 6}px` }}
        data-testid={categoryTreeTestId('tree-row', props.node.value)}
      >
        <BudgetCategoryTreeExpandToggle
          pathValue={props.node.value}
          hasChildren={s.hasChildren()}
          expanded={s.expanded()}
          onToggle={() => s.setExpanded((prev) => !prev)}
        />

        <Show
          when={!s.renaming()}
          fallback={
            <BudgetCategoryTreeRenameEditor
              pathValue={props.node.value}
              renameValue={s.renameValue}
              onRenameValueChange={s.onRenameValueChange}
              renameError={s.renameError}
              onConfirm={s.confirmRename}
              onCancel={s.cancelRename}
              onKeyDown={s.handleRenameKeyDown}
            />
          }
        >
          <span
            class="text-sm font-medium truncate flex-1 min-w-0"
            classList={{ 'opacity-50': s.isMutating() }}
          >
            {props.node.label}
          </span>
        </Show>

        <Show when={!s.renaming() && !s.isMutating()}>
          <BudgetCategoryTreeRowActions
            pathValue={props.node.value}
            nodeLabel={props.node.label}
            onAddChild={() => s.setAddingChild(true)}
            onRename={s.startRename}
            onDelete={s.handleDelete}
          />
        </Show>
      </div>

      <Show when={s.addingChild()}>
        <div style={{ 'padding-left': `${s.pad() + 26}px` }}>
          <BudgetCategoryInlineAddForm
            placeholder={`New subcategory of ${props.node.label}...`}
            onSubmit={(name) => s.handleAddChild(name)}
            onCancel={() => s.setAddingChild(false)}
            data-testid={categoryTreeTestId('add-child-form', props.node.value)}
          />
        </div>
      </Show>

      <Show when={s.hasChildren() && s.expanded()}>
        <ul class="m-0 p-0">
          <For each={s.children()}>
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
