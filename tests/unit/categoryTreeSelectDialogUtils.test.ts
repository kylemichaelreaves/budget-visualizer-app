import { describe, expect, it } from 'vitest'
import type { CategoryNode } from '@types'
import {
  flattenWithBreadcrumb,
  getVisibleNodes,
} from '@components/transactions/selects/categoryTreeSelectDialogUtils'

const tree: CategoryNode[] = [
  {
    label: 'Food',
    value: 'Food',
    children: [
      { label: 'Groceries', value: 'Food - Groceries' },
      {
        label: 'Restaurants',
        value: 'Food - Restaurants',
        children: [{ label: 'Fast Food', value: 'Food - Restaurants - Fast Food' }],
      },
    ],
  },
  { label: 'Transport', value: 'Transport' },
]

describe('flattenWithBreadcrumb', () => {
  it('flattens all nodes with ancestor breadcrumbs', () => {
    const flat = flattenWithBreadcrumb(tree)
    expect(flat).toHaveLength(5)

    expect(flat[0]).toEqual({ node: tree[0], breadcrumb: [] })
    expect(flat[1]).toEqual({ node: tree[0].children![0], breadcrumb: ['Food'] })
    expect(flat[2]).toEqual({ node: tree[0].children![1], breadcrumb: ['Food'] })
    expect(flat[3]).toEqual({
      node: tree[0].children![1].children![0],
      breadcrumb: ['Food', 'Restaurants'],
    })
    expect(flat[4]).toEqual({ node: tree[1], breadcrumb: [] })
  })

  it('returns empty array for empty input', () => {
    expect(flattenWithBreadcrumb([])).toEqual([])
  })
})

describe('getVisibleNodes', () => {
  it('returns only top-level nodes when nothing is expanded', () => {
    const visible = getVisibleNodes(tree, new Set())
    expect(visible.map((n) => n.value)).toEqual(['Food', 'Transport'])
  })

  it('includes children of expanded nodes', () => {
    const visible = getVisibleNodes(tree, new Set(['Food']))
    expect(visible.map((n) => n.value)).toEqual([
      'Food',
      'Food - Groceries',
      'Food - Restaurants',
      'Transport',
    ])
  })

  it('recursively includes deeply expanded nodes', () => {
    const visible = getVisibleNodes(tree, new Set(['Food', 'Food - Restaurants']))
    expect(visible.map((n) => n.value)).toEqual([
      'Food',
      'Food - Groceries',
      'Food - Restaurants',
      'Food - Restaurants - Fast Food',
      'Transport',
    ])
  })

  it('ignores expanded values that do not match any node', () => {
    const visible = getVisibleNodes(tree, new Set(['Nonexistent']))
    expect(visible.map((n) => n.value)).toEqual(['Food', 'Transport'])
  })
})
