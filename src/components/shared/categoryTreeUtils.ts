import type { CategoryNode } from '@types'

export interface FlatNode {
  node: CategoryNode
  breadcrumb: string[]
}

/** Flatten the entire tree into a flat list with breadcrumb paths. */
export function flatten(nodes: CategoryNode[], ancestors: string[] = []): FlatNode[] {
  return nodes.flatMap((n) => [
    { node: n, breadcrumb: ancestors },
    ...flatten(n.children ?? [], [...ancestors, n.label]),
  ])
}

/** Flatten the tree respecting which nodes are currently expanded. */
export function flattenVisible(
  nodes: CategoryNode[],
  expanded: Set<string>,
  ancestors: string[] = [],
): FlatNode[] {
  return nodes.flatMap((n) => {
    const self: FlatNode = { node: n, breadcrumb: ancestors }
    if ((n.children?.length ?? 0) > 0 && expanded.has(n.value)) {
      return [self, ...flattenVisible(n.children!, expanded, [...ancestors, n.label])]
    }
    return [self]
  })
}
