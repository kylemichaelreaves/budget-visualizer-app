import { BUDGET_CATEGORY_PATH_DELIMITER } from '@api/helpers/convertToTree'
import type { CategoryNode } from '@types'

/** Stable `data-testid` segment from category path (`node.value`); avoids duplicate/unsafe IDs from labels. */
export function categoryPathTestIdSlug(pathValue: string): string {
  const s = pathValue.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return s || 'root'
}

export function categoryTreeTestId(prefix: string, pathValue: string): string {
  return `${prefix}-${categoryPathTestIdSlug(pathValue)}`
}

export function budgetCategorySegmentValidationError(trimmed: string): string | null {
  if (!trimmed.includes(BUDGET_CATEGORY_PATH_DELIMITER)) return null
  return `Category names cannot contain "${BUDGET_CATEGORY_PATH_DELIMITER}" (that sequence is reserved between path levels).`
}

export function filterTree(nodes: CategoryNode[], q: string): CategoryNode[] {
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
