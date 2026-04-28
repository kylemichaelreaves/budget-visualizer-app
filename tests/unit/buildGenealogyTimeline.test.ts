import { describe, expect, it } from 'vitest'
import {
  buildGenealogyTimelineSteps,
  layoutGenealogyTimelineAxis,
  timelineStepIndexForNodeId,
} from '@genealogy/lib/buildGenealogyTimeline'
import { genealogyData } from '../../src/data/genealogy'
import type { GenealogyNode } from '../../src/types/genealogy'

function node(partial: Partial<GenealogyNode> & Pick<GenealogyNode, 'id'>): GenealogyNode {
  return {
    fullName: 'Test',
    birthYear: null,
    birthLocation: '',
    birthCoords: { lat: 0, lng: 0 },
    deathYear: null,
    deathLocation: null,
    deathCoords: null,
    parentId: null,
    spouseId: null,
    ...partial,
  }
}

describe('buildGenealogyTimelineSteps', () => {
  it('includes every dated birth and death when unpinned', () => {
    const steps = buildGenealogyTimelineSteps(genealogyData, null)
    expect(steps.length).toBeGreaterThan(0)
    const years = steps.map((s) => s.year)
    expect(years).toEqual([...years].sort((a, b) => a - b))
    expect(steps.some((s) => s.nodeId === 'william-rives' && s.kind === 'birth')).toBe(true)
  })

  it('scopes to lineage when pinned', () => {
    const full = buildGenealogyTimelineSteps(genealogyData, null)
    const lineage = buildGenealogyTimelineSteps(genealogyData, 'ransom-reaves')
    expect(lineage.length).toBeLessThanOrEqual(full.length)
    expect(
      lineage.every((s) => full.some((f) => f.nodeId === s.nodeId && f.kind === s.kind && f.year === s.year)),
    ).toBe(true)
    expect(lineage.some((s) => s.nodeId === 'john-sr')).toBe(true)
    expect(lineage.some((s) => s.nodeId === 'william-rives')).toBe(true)
    expect(lineage.some((s) => s.nodeId === 'lee-reaves')).toBe(true)
  })

  it('layoutGenealogyTimelineAxis centers a single step', () => {
    const nodes = [node({ id: 'a', fullName: 'A', birthYear: 1800, birthLocation: 'Here' })]
    const steps = buildGenealogyTimelineSteps(nodes, null)
    const layout = layoutGenealogyTimelineAxis(steps)
    expect(layout).toHaveLength(1)
    expect(layout[0]!.leftPct).toBe(50)
  })

  it('timelineStepIndexForNodeId prefers birth over death', () => {
    const nodes = [
      node({
        id: 'a',
        fullName: 'A',
        birthYear: 1800,
        birthLocation: 'Here',
        deathYear: 1880,
        deathLocation: 'There',
      }),
    ]
    const steps = buildGenealogyTimelineSteps(nodes, null)
    expect(steps.length).toBe(2)
    expect(timelineStepIndexForNodeId(steps, 'a')).toBe(steps.findIndex((s) => s.kind === 'birth'))
  })

  it('layoutGenealogyTimelineAxis orders marks by year span', () => {
    const nodes = [
      node({ id: 'a', fullName: 'A', birthYear: 1700, birthLocation: 'Here' }),
      node({ id: 'b', fullName: 'B', birthYear: 1900, birthLocation: 'There' }),
    ]
    const steps = buildGenealogyTimelineSteps(nodes, null)
    const layout = layoutGenealogyTimelineAxis(steps)
    expect(layout[0]!.leftPct).toBeLessThan(layout[1]!.leftPct)
  })

  it('dedupes identical year, kind, and node', () => {
    const nodes = [node({ id: 'a', fullName: 'A', birthYear: 1800, birthLocation: 'Here' })]
    const steps = buildGenealogyTimelineSteps(nodes, null)
    expect(steps.filter((s) => s.nodeId === 'a' && s.kind === 'birth')).toHaveLength(1)
  })
})
