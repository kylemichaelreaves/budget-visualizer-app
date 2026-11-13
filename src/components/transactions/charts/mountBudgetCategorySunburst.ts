import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import {
  type BudgetCategoryColorHelpers,
  getBudgetCategoryColorForChartCell,
} from '@composables/budgetCategoryColors'
import {
  buildBudgetCategoryChartHierarchy,
  type BudgetCategoryChartHierarchyNode,
} from './budgetCategoryChartHierarchy'
import {
  SUNBURST_CX,
  SUNBURST_CY,
  SUNBURST_RADIUS,
  SUNBURST_SIZE,
  SUNBURST_TRANSITION_MS,
  sunburstArcVisible,
  sunburstLabelTransform,
  sunburstLabelVisible,
  type SunburstArcCoords,
} from './budgetCategorySunburstGeometry'
import { formatUsd } from '@utils/formatUsd'

type HierarchyNode = BudgetCategoryChartHierarchyNode

export type AugmentedNode = d3.HierarchyRectangularNode<HierarchyNode> & {
  current: SunburstArcCoords
  target: SunburstArcCoords
}

export type SunburstBreadcrumb = { name: string; node: AugmentedNode }

export type BudgetCategorySunburstNavigation = {
  zoomTo: (node: AugmentedNode) => void
  rootNode: AugmentedNode
}

export function mountBudgetCategorySunburstChart(opts: {
  svg: SVGSVGElement
  data: BudgetCategorySummary[]
  colorHelpers: BudgetCategoryColorHelpers
  tooltipEl: HTMLDivElement | undefined
  setCenterName: (v: string) => void
  setCenterValue: (v: number) => void
  setBreadcrumb: (b: SunburstBreadcrumb[]) => void
  onSliceClick?: (row: BudgetCategorySummary) => void
  setNavigation: (api: BudgetCategorySunburstNavigation) => void
}): void {
  const {
    svg,
    data,
    colorHelpers: helpers,
    tooltipEl: tooltip,
    setCenterName,
    setCenterValue,
    setBreadcrumb,
  } = opts

  const hierarchy = d3
    .hierarchy(buildBudgetCategoryChartHierarchy(data))
    .sum((d) => (d.children ? 0 : Math.abs(d.total_amount_debit)))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  // `current` / `target` are filled in just below; the partition supplies the rest.
  const root = d3.partition<HierarchyNode>().size([2 * Math.PI, hierarchy.height + 1])(
    hierarchy,
  ) as AugmentedNode

  const totalValue = root.value ?? 1

  root.each((d) => {
    d.current = d
  })

  setCenterName('Total')
  setCenterValue(totalValue)
  setBreadcrumb([])

  d3.select(svg).selectAll('*').remove()

  d3.select(svg)
    .attr('viewBox', `0 0 ${SUNBURST_SIZE} ${SUNBURST_SIZE}`)
    .style('width', '100%')
    .style('height', 'auto')

  const g = d3.select(svg).append('g').attr('transform', `translate(${SUNBURST_CX},${SUNBURST_CY})`)

  const arc = d3
    .arc<SunburstArcCoords>()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(SUNBURST_RADIUS * 1.5)
    .innerRadius((d) => d.y0 * SUNBURST_RADIUS)
    .outerRadius((d) => Math.max(d.y0 * SUNBURST_RADIUS, d.y1 * SUNBURST_RADIUS - 1))

  const descendants = root.descendants().slice(1)

  const path = g
    .append('g')
    .selectAll<SVGPathElement, AugmentedNode>('path')
    .data(descendants)
    .join('path')
    .attr('fill', (d) => getBudgetCategoryColorForChartCell(helpers, d.data))
    .attr('fill-opacity', (d) => (sunburstArcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0))
    .attr('pointer-events', (d) => (sunburstArcVisible(d.current) ? 'auto' : 'none'))
    .attr('d', (d) => arc(d.current))
    .style('cursor', (d) => (d.children ? 'pointer' : 'default'))

  const label = g
    .append('g')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .style('user-select', 'none')
    .selectAll<SVGTextElement, AugmentedNode>('text')
    .data(descendants)
    .join('text')
    .attr('dy', '0.35em')
    .attr('fill-opacity', (d) => +sunburstLabelVisible(d.current))
    .attr('transform', (d) => sunburstLabelTransform(d.current))
    .style('font-size', '10px')
    .style('fill', 'currentColor')
    .text((d) => d.data.name)

  const parentCircle = g
    .append('circle')
    .datum(root)
    .attr('r', SUNBURST_RADIUS)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .style('cursor', 'default')

  /** Tooltip uses `position: absolute` relative to `offsetParent`, not necessarily the SVG wrapper. */
  function tooltipAnchorRect(): DOMRect | null {
    if (!tooltip) return null
    const anchor =
      (tooltip.offsetParent instanceof HTMLElement ? tooltip.offsetParent : null) ?? svg.parentElement
    if (!anchor) return null
    return anchor.getBoundingClientRect()
  }

  path
    .on('mouseenter', function (event: MouseEvent, d: AugmentedNode) {
      path.attr('fill-opacity', (p: AugmentedNode) => {
        if (!sunburstArcVisible(p.current)) return 0
        if (p === d) return 0.9
        if (p.ancestors().includes(d)) return d.children ? 0.7 : 0.55
        return 0.15
      })

      if (tooltip) {
        const anchorRect = tooltipAnchorRect()
        if (anchorRect) {
          tooltip.textContent = ''
          const strong = document.createElement('strong')
          strong.textContent = d.data.category_name
          tooltip.appendChild(strong)
          tooltip.appendChild(document.createElement('br'))
          tooltip.appendChild(
            document.createTextNode(formatUsd(Math.abs(d.value ?? d.data.total_amount_debit))),
          )
          tooltip.style.left = `${event.clientX - anchorRect.left + 12}px`
          tooltip.style.top = `${event.clientY - anchorRect.top - 12}px`
          tooltip.style.opacity = '1'
        }
      }
    })
    .on('mousemove', function (event: MouseEvent) {
      if (tooltip) {
        const anchorRect = tooltipAnchorRect()
        if (anchorRect) {
          tooltip.style.left = `${event.clientX - anchorRect.left + 12}px`
          tooltip.style.top = `${event.clientY - anchorRect.top - 12}px`
        }
      }
    })
    .on('mouseleave', function () {
      path.attr('fill-opacity', (d: AugmentedNode) =>
        sunburstArcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0,
      )
      if (tooltip) tooltip.style.opacity = '0'
    })

  function clicked(_event: Event, p: AugmentedNode) {
    parentCircle.datum(p.parent || root)
    parentCircle.style('cursor', p === root ? 'default' : 'pointer')
    root.each((node) => {
      node.target = {
        x0: Math.max(0, Math.min(1, (node.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (node.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, node.y0 - p.depth),
        y1: Math.max(0, node.y1 - p.depth),
      }
    })

    // Arcs and labels start in the same tick with the same timing, so they stay in
    // step without sharing one parent transition (whose element type d3's typings
    // won't accept for a child selection without an `any` cast).
    const zoom = <E extends d3.BaseType>(sel: d3.Selection<E, AugmentedNode, SVGGElement, unknown>) =>
      sel.transition().duration(SUNBURST_TRANSITION_MS).ease(d3.easeCubicInOut)

    zoom(path)
      .tween('data', (d: AugmentedNode) => {
        const i = d3.interpolate(d.current, d.target)
        return (t2: number) => {
          d.current = i(t2)
        }
      })
      .filter(function (this: SVGPathElement, d: AugmentedNode) {
        return !!(+(this.getAttribute('fill-opacity') ?? 0) || sunburstArcVisible(d.target))
      })
      .attr('fill-opacity', (d: AugmentedNode) =>
        sunburstArcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0,
      )
      .attr('pointer-events', (d: AugmentedNode) => (sunburstArcVisible(d.target) ? 'auto' : 'none'))
      .attrTween('d', (d: AugmentedNode) => () => arc(d.current)!)

    zoom(
      label.filter(function (this: SVGTextElement, d: AugmentedNode) {
        return !!(+(this.getAttribute('fill-opacity') ?? 0) || sunburstLabelVisible(d.target))
      }),
    )
      .attr('fill-opacity', (d: AugmentedNode) => +sunburstLabelVisible(d.target))
      .attrTween('transform', (d: AugmentedNode) => () => sunburstLabelTransform(d.current))

    setCenterName(p.data.category_id === 0 ? 'Total' : p.data.category_name)
    setCenterValue(p.value ?? 0)

    const ancestors: SunburstBreadcrumb[] = []
    let cur: AugmentedNode | null = p
    while (cur) {
      if (cur.data.category_id !== 0) {
        ancestors.unshift({ name: cur.data.category_name, node: cur })
      }
      cur = cur.parent as AugmentedNode | null
    }
    setBreadcrumb(ancestors)

    if (p.data.category_id > 0) {
      opts.onSliceClick?.(p.data)
    }
  }

  path.filter((d: AugmentedNode) => !!d.children).on('click', clicked)
  parentCircle.on('click', function (this: SVGCircleElement, event: MouseEvent) {
    clicked(event, d3.select<SVGCircleElement, AugmentedNode>(this).datum())
  })

  opts.setNavigation({ zoomTo: (node) => clicked(new MouseEvent('click'), node), rootNode: root })
}
