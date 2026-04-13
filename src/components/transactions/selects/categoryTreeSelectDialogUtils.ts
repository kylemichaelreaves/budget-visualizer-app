import type { CategoryNode } from '@types'

export function flattenWithBreadcrumb(
  nodes: CategoryNode[],
  ancestors: string[] = [],
): { node: CategoryNode; breadcrumb: string[] }[] {
  return nodes.flatMap((n) => [
    { node: n, breadcrumb: ancestors },
    ...(n.children ? flattenWithBreadcrumb(n.children, [...ancestors, n.label]) : []),
  ])
}

/** Collect visible nodes from the tree respecting expand state. */
export function getVisibleNodes(nodes: CategoryNode[], expanded: Set<string>): CategoryNode[] {
  const out: CategoryNode[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children?.length && expanded.has(n.value)) {
      out.push(...getVisibleNodes(n.children, expanded))
    }
  }
  return out
}
