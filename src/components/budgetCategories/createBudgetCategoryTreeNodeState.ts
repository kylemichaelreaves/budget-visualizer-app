import { BUDGET_CATEGORY_PATH_DELIMITER } from '@api/helpers/convertToTree'
import type { CategoryNode } from '@types'
import { createSignal } from 'solid-js'
import type { BudgetCategoryOperation } from './mutateBudgetCategory'
import { budgetCategorySegmentValidationError } from './budgetCategoryTreeUtils'

type TreeNodeProps = {
  node: CategoryNode
  depth: number
  onMutate: (op: BudgetCategoryOperation) => Promise<void>
  mutatingPaths: Set<string>
}

export function createBudgetCategoryTreeNodeState(props: TreeNodeProps) {
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

  const onRenameValueChange = (v: string) => {
    setRenameValue(v)
    setRenameError(null)
  }

  const cancelRename = () => {
    setRenameError(null)
    setRenaming(false)
  }

  return {
    children,
    hasChildren,
    pad,
    expanded,
    setExpanded,
    renaming,
    renameValue,
    renameError,
    addingChild,
    setAddingChild,
    isMutating,
    startRename,
    confirmRename,
    handleRenameKeyDown,
    handleAddChild,
    handleDelete,
    onRenameValueChange,
    cancelRename,
  }
}
