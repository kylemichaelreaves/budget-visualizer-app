import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'

/**
 * Node shape shared by sunburst / treemap hierarchy builders. It is a
 * `BudgetCategorySummary`, so a node's `data` can go straight to click
 * handlers and color lookups without a cast.
 */
export interface BudgetCategoryChartHierarchyNode extends BudgetCategorySummary {
  name: string
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

    // Capture child totals before recursion — processNode zeroes
    // total_amount_debit on any child that itself has children, so deferring
    // this sum until after recursing would undercount multi-level subtrees.
    const childSum = node.children.reduce((sum, c) => sum + Math.abs(c.total_amount_debit), 0)

    for (const child of node.children) processNode(child)

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

/**
 * Whether there is anything to draw: at least one top-level category with
 * non-zero spend. Without one the hierarchy has no leaves to size.
 */
export function hasChartableBudgetCategoryData(data: readonly BudgetCategorySummary[]): boolean {
  return data.some((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)
}

/**
 * The summed, sorted d3 hierarchy both the treemap and the sunburst lay out.
 * Only leaves carry value (parents' own totals were moved into "Other" leaves),
 * and larger categories sort first.
 */
export function buildBudgetCategoryRoot(
  data: BudgetCategorySummary[],
): d3.HierarchyNode<BudgetCategoryChartHierarchyNode> {
  return d3
    .hierarchy(buildBudgetCategoryChartHierarchy(data))
    .sum((d) => (d.children ? 0 : Math.abs(d.total_amount_debit)))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
}
