import { describe, expect, it } from 'vitest'
import { useTreeLayout } from '@components/genealogy/useTreeLayout'
import type { GenealogyNode } from '../../src/types/genealogy'

function makeNode(id: string, parentId: string | null): GenealogyNode {
  return {
    id,
    fullName: id,
    birthYear: 1800,
    birthLocation: '',
    birthCoords: { lat: 0, lng: 0 },
    deathYear: null,
    deathLocation: null,
    deathCoords: null,
    parentId,
    spouseId: null,
  }
}

describe('useTreeLayout', () => {
  it('places a single root at depth 0 centered horizontally', () => {
    const layout = useTreeLayout([makeNode('a', null)], { width: 320 })
    expect(layout).toHaveLength(1)
    expect(layout[0]?.depth).toBe(0)
    expect(layout[0]?.y).toBe(16) // topPadding
    expect(layout[0]?.x).toBe(100) // (320 - 120) / 2
  })

  it('puts siblings on the same row, centered as a group', () => {
    const layout = useTreeLayout(
      [makeNode('parent', null), makeNode('a', 'parent'), makeNode('b', 'parent')],
      { width: 400 },
    )
    const a = layout.find((l) => l.node.id === 'a')!
    const b = layout.find((l) => l.node.id === 'b')!
    expect(a.depth).toBe(1)
    expect(b.depth).toBe(1)
    expect(a.y).toBe(b.y)
    // Two cards of 120 with 16 gap = 256 total, centered in 400 → start at 72
    expect(a.x).toBe(72)
    expect(b.x).toBe(72 + 120 + 16)
  })

  it('walks multi-generation chains', () => {
    const layout = useTreeLayout(
      [makeNode('g0', null), makeNode('g1', 'g0'), makeNode('g2', 'g1'), makeNode('g3', 'g2')],
      { width: 400 },
    )
    expect(layout.find((l) => l.node.id === 'g0')?.depth).toBe(0)
    expect(layout.find((l) => l.node.id === 'g1')?.depth).toBe(1)
    expect(layout.find((l) => l.node.id === 'g2')?.depth).toBe(2)
    expect(layout.find((l) => l.node.id === 'g3')?.depth).toBe(3)

    const rowGap = 32
    const cardHeight = 64
    const rowHeight = cardHeight + rowGap
    expect(layout.find((l) => l.node.id === 'g3')?.y).toBe(16 + 3 * rowHeight)
  })

  it('treats orphans (parentId pointing to missing node) as roots', () => {
    const layout = useTreeLayout([makeNode('a', 'missing-parent')], { width: 200 })
    expect(layout[0]?.depth).toBe(0)
    expect(layout[0]?.y).toBe(16)
  })
})
