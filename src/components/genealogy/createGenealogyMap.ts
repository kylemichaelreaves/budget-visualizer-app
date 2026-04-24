import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { GenealogyNode } from '../../types/genealogy'
import statesTopology from 'us-atlas/states-10m.json'

// FIPS codes for the southern US — used to filter the state features so the
// map auto-fits the relevant region rather than the full continental US.
const SOUTHERN_STATE_FIPS = new Set([
  '01', // Alabama
  '05', // Arkansas
  '12', // Florida
  '13', // Georgia
  '21', // Kentucky
  '22', // Louisiana
  '28', // Mississippi
  '37', // North Carolina
  '40', // Oklahoma
  '45', // South Carolina
  '47', // Tennessee
  '48', // Texas
  '51', // Virginia
  '54', // West Virginia
])

const SELECTED_RADIUS = 9
const DEFAULT_RADIUS = 6
const PADDING = 16

export type GenealogyMapCallbacks = {
  onNodeEnter: (node: GenealogyNode, event: PointerEvent) => void
  onNodeMove: (node: GenealogyNode, event: PointerEvent) => void
  onNodeLeave: () => void
}

export type GenealogyMapHandle = {
  setSelected: (id: string | null) => void
  destroy: () => void
}

type StatesTopology = Topology<{ states: GeometryCollection }>

export function createGenealogyMap(
  svgEl: SVGSVGElement,
  nodes: GenealogyNode[],
  width: number,
  height: number,
  callbacks: GenealogyMapCallbacks,
): GenealogyMapHandle {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)

  // Arrowhead marker for connector paths.
  const defs = svg.append('defs')
  defs
    .append('marker')
    .attr('id', 'genealogy-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'var(--chart-1)')

  const root = svg.append('g').attr('data-role', 'genealogy-map-root')

  const topo = statesTopology as unknown as StatesTopology
  const allStates = feature(topo, topo.objects.states) as unknown as FeatureCollection<Geometry>
  const southern: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: allStates.features.filter((f: Feature<Geometry>) => SOUTHERN_STATE_FIPS.has(String(f.id))),
  }

  const projection = d3.geoAlbersUsa().fitExtent(
    [
      [PADDING, PADDING],
      [width - PADDING, height - PADDING],
    ],
    southern,
  )
  const path = d3.geoPath(projection)

  root
    .append('g')
    .attr('data-role', 'states')
    .selectAll('path')
    .data(southern.features)
    .join('path')
    .attr('d', (f) => path(f) ?? '')
    .attr('fill', 'var(--muted)')
    .attr('stroke', 'var(--border)')
    .attr('stroke-width', 0.5)

  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const projectNode = (n: GenealogyNode): [number, number] | null =>
    projection([n.birthCoords.lng, n.birthCoords.lat])

  // Parent → child connectors, sorted by child birth year (nulls last).
  const connectors = nodes
    .filter((n) => n.parentId && nodeById.has(n.parentId))
    .map((n) => ({
      child: n,
      parent: nodeById.get(n.parentId!)!,
    }))
    .sort((a, b) => {
      const ay = a.child.birthYear ?? Number.POSITIVE_INFINITY
      const by = b.child.birthYear ?? Number.POSITIVE_INFINITY
      return ay - by
    })

  root
    .append('g')
    .attr('data-role', 'connectors')
    .selectAll('path')
    .data(connectors)
    .join('path')
    .attr('d', ({ parent, child }) => {
      const p = projectNode(parent)
      const c = projectNode(child)
      if (!p || !c) return ''
      const [px, py] = p
      const [cx, cy] = c
      const mx = (px + cx) / 2
      const my = (py + cy) / 2 - Math.abs(cx - px) * 0.2
      return `M ${px} ${py} Q ${mx} ${my} ${cx} ${cy}`
    })
    .attr('fill', 'none')
    .attr('stroke', 'var(--chart-1)')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.25)
    .attr('stroke-dasharray', '6 3')
    .attr('marker-end', 'url(#genealogy-arrow)')

  const circles = root
    .append('g')
    .attr('data-role', 'nodes')
    .selectAll<SVGCircleElement, GenealogyNode>('circle')
    .data(nodes, (n) => n.id)
    .join('circle')
    .attr('cx', (n) => projectNode(n)?.[0] ?? -9999)
    .attr('cy', (n) => projectNode(n)?.[1] ?? -9999)
    .attr('r', DEFAULT_RADIUS)
    .attr('fill', 'var(--chart-1)')
    .attr('stroke', 'var(--background)')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'pointer')
    .attr('data-node-id', (n) => n.id)

  circles
    .on('pointerenter', (event: PointerEvent, n) => callbacks.onNodeEnter(n, event))
    .on('pointermove', (event: PointerEvent, n) => callbacks.onNodeMove(n, event))
    .on('pointerleave', () => callbacks.onNodeLeave())

  // Append titles for accessibility / native browser tooltips.
  circles.append('title').text((n) => n.fullName)

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.8, 6])
    .on('zoom', (event) => {
      root.attr('transform', event.transform.toString())
    })

  svg.call(zoomBehavior)

  function setSelected(id: string | null): void {
    circles
      .attr('r', (n) => (n.id === id ? SELECTED_RADIUS : DEFAULT_RADIUS))
      .attr('opacity', (n) => (id === null || n.id === id ? 1 : 0.3))
  }

  function destroy(): void {
    svg.on('.zoom', null)
    svg.selectAll('*').remove()
  }

  return { setSelected, destroy }
}
