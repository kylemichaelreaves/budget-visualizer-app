import { describe, expect, it } from 'vitest'
import { convertToTree } from '@api/helpers/convertToTree'
import type { Categories } from '@types'

describe('convertToTree', () => {
  it('builds paths and labels for nested categories', () => {
    const input: Categories = {
      Food: {
        Groceries: {},
        Restaurants: {},
      },
    }
    const tree = convertToTree(input)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.label).toBe('Food')
    expect(tree[0]?.value).toBe('Food')
    expect(tree[0]?.children).toHaveLength(2)
    const groceries = tree[0]?.children?.find((c) => c.label === 'Groceries')
    expect(groceries?.value).toBe('Food - Groceries')
  })
})
