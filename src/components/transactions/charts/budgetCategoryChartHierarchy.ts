import type { BudgetCategorySummary } from '@types'

/** Node shape shared by sunburst / treemap hierarchy builders. */
export interface BudgetCategoryChartHierarchyNode {
  name: string
  category_id: number
  full_path: string
  budget_category: string
  total_amount_debit: number
  parent_id: number | null
  level: number
  source_id: number
  category_name: string
  children?: BudgetCategoryChartHierarchyNode[]
}

/**
 * Build a tree for partition / treemap layouts from flat API rows.
 * Parents include child totals; leaves hold spend. Synthetic "Other" leaves
 * capture parent remainder so `d3.hierarchy().sum()` only counts leaves.
 */
export function buildBudgetCategoryChartHierarchy(
  data: BudgetCategorySummary[],
): BudgetCategoryChartHierarchyNode {
  const filtered = data.filter((d) => Math.abs(d.total_amount_debit) > 0)

  const nodeMap = new Map<number, BudgetCategoryChartHierarchyNode>()
  for (const item of filtered) {
    nodeMap.set(item.category_id, {
      ...item,
      name: item.category_name,
      children: [],
    })
  }

  const topLevel: BudgetCategoryChartHierarchyNode[] = []

  for (const item of filtered) {
    if (item.parent_id === null) {
      topLevel.push(nodeMap.get(item.category_id)!)
    } else {
      const parent = nodeMap.get(item.parent_id)
      if (parent) {
        parent.children!.push(nodeMap.get(item.category_id)!)
      } else {
        topLevel.push(nodeMap.get(item.category_id)!)
      }
    }
  }

  function processNode(node: BudgetCategoryChartHierarchyNode): void {
    if (!node.children?.length) return

    for (const child of node.children) processNode(child)

    const childSum = node.children.reduce((sum, c) => sum + Math.abs(c.total_amount_debit), 0)
    const parentAbs = Math.abs(node.total_amount_debit)
    const remainder = parentAbs - childSum

    if (remainder > 0.01) {
      node.children.push({
        name: 'Other',
        category_name: `Other ${node.category_name}`,
        category_id: -(node.category_id * 1000),
        full_path: node.full_path,
        budget_category: node.budget_category,
        total_amount_debit: -remainder,
        parent_id: node.category_id,
        level: node.level + 1,
        source_id: node.source_id,
      })
    }

    node.total_amount_debit = 0
  }

  for (const node of topLevel) processNode(node)

  function cleanEmpty(node: BudgetCategoryChartHierarchyNode): void {
    if (node.children?.length === 0) {
      delete node.children
    } else if (node.children) {
      for (const child of node.children) cleanEmpty(child)
    }
  }
  for (const node of topLevel) cleanEmpty(node)

  return {
    name: 'Total',
    category_name: 'Total',
    category_id: 0,
    full_path: '',
    budget_category: '',
    total_amount_debit: 0,
    parent_id: null,
    level: -1,
    source_id: 0,
    children: topLevel,
  }
}
