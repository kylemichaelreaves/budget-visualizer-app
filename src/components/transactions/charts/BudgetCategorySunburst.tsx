import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import { buildBudgetCategoryColorMap } from '@composables/budgetCategoryColors'
import { Skeleton } from '@components/ui/skeleton'
import { formatUsd } from '@utils/formatUsd'
import { ChevronRightIcon } from '@shared/icons/ChevronRightIcon'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import type { Timeframe } from '@types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HierarchyNode {
  name: string
  category_id: number
  full_path: string
  budget_category: string
  total_amount_debit: number
  parent_id: number | null
  level: number
  source_id: number
  category_name: string
  children?: HierarchyNode[]
}

interface ArcCoords {
  x0: number
  x1: number
  y0: number
  y1: number
}

type AugmentedNode = d3.HierarchyRectangularNode<HierarchyNode> & {
  current: ArcCoords
  target: ArcCoords
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE = 400
const radius = SIZE / 6
const CX = SIZE / 2
const CY = SIZE / 2
const DURATION = 750

// ── Hierarchy builder ─────────────────────────────────────────────────────────

function buildSunburstHierarchy(data: BudgetCategorySummary[]): HierarchyNode {
  const filtered = data.filter((d) => Math.abs(d.total_amount_debit) > 0)

  const nodeMap = new Map<number, HierarchyNode>()
  for (const item of filtered) {
    nodeMap.set(item.category_id, {
      ...item,
      name: item.category_name,
      children: [],
    })
  }

  const topLevel: HierarchyNode[] = []

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

  // Prevent double-counting: parents already include child totals.
  // Move the "remainder" into a synthetic "Other" leaf so d3.hierarchy().sum()
  // only counts leaf nodes.
  function processNode(node: HierarchyNode): void {
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

    // Zero out so sum() only counts leaves
    node.total_amount_debit = 0
  }

  for (const node of topLevel) processNode(node)

  function cleanEmpty(node: HierarchyNode): void {
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

// ── Visibility helpers (Observable pattern) ───────────────────────────────────

const arcVisible = (d: ArcCoords) => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0

const labelVisible = (d: ArcCoords) => d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03

const labelTransform = (d: ArcCoords) => {
  const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
  const y = ((d.y0 + d.y1) / 2) * radius
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BudgetCategorySunburst(props: {
  data: BudgetCategorySummary[]
  isLoading?: boolean
  dataTestId?: string
  onSliceClick?: (row: BudgetCategorySummary) => void
  showLegend?: boolean
  timeFrame?: Timeframe
  date?: string
}): JSX.Element {
  let svgRef: SVGSVGElement | undefined
  let tooltipRef: HTMLDivElement | undefined

  const [breadcrumb, setBreadcrumb] = createSignal<Array<{ name: string; node: unknown }>>([])
  const [centerName, setCenterName] = createSignal('Total')
  const [centerValue, setCenterValue] = createSignal(0)

  // Store zoom function and root node so breadcrumb can navigate
  let zoomTo: ((node: unknown) => void) | undefined
  let rootNode: AugmentedNode | undefined

  const colorMap = createMemo(() => buildBudgetCategoryColorMap(props.data))

  createEffect(() => {
    const data = props.data
    const svg = svgRef
    if (!svg || props.isLoading || !data?.length) {
      if (svg) svg.innerHTML = ''
      return
    }

    const parents = data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)
    if (!parents.length) {
      svg.innerHTML = ''
      return
    }

    const colors = colorMap()

    // Build hierarchy
    const hierarchyData = buildSunburstHierarchy(data)
    const root = d3
      .hierarchy(hierarchyData)
      .sum((d) => (d.children ? 0 : Math.abs(d.total_amount_debit)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as unknown as AugmentedNode

    d3.partition<HierarchyNode>().size([2 * Math.PI, root.height + 1])(
      root as unknown as d3.HierarchyNode<HierarchyNode>,
    )

    const totalValue = root.value ?? 1

    // Store initial position
    ;(root as AugmentedNode).each((d: unknown) => {
      ;(d as AugmentedNode).current = d as ArcCoords
    })

    setCenterName('Total')
    setCenterValue(totalValue)
    setBreadcrumb([])

    // Clear and set up SVG
    d3.select(svg).selectAll('*').remove()

    d3.select(svg).attr('viewBox', `0 0 ${SIZE} ${SIZE}`).style('width', '100%').style('height', 'auto')

    const g = d3.select(svg).append('g').attr('transform', `translate(${CX},${CY})`)

    // Arc generator
    const arc = d3
      .arc<ArcCoords>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1))

    // Arc paths (skip root)
    const descendants = root.descendants().slice(1) as AugmentedNode[]

    const path = g
      .append('g')
      .selectAll<SVGPathElement, AugmentedNode>('path')
      .data(descendants)
      .join('path')
      .attr('fill', (d) => {
        const id = String(d.data.category_id)
        if (colors.has(id)) return colors.get(id)!
        // For synthetic "Other" nodes, use a muted version of parent color
        let anc = d.parent as AugmentedNode | null
        while (anc && anc.depth > 0) {
          const ancColor = colors.get(String(anc.data.category_id))
          if (ancColor) {
            const shade = d3.color(ancColor)?.darker(0.5 + (d.depth - anc.depth) * 0.2)
            return shade ? shade.toString() : '#6b7280'
          }
          anc = anc.parent as AugmentedNode | null
        }
        return '#6b7280'
      })
      .attr('fill-opacity', (d) => (arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0))
      .attr('pointer-events', (d) => (arcVisible(d.current) ? 'auto' : 'none'))
      .attr('d', (d) => arc(d.current))
      .style('cursor', (d) => (d.children ? 'pointer' : 'default'))

    // Arc labels
    const label = g
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll<SVGTextElement, AugmentedNode>('text')
      .data(descendants)
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d) => +labelVisible(d.current))
      .attr('transform', (d) => labelTransform(d.current))
      .style('font-size', '10px')
      .style('fill', 'currentColor')
      .text((d) => d.data.name)

    // Center circle — click to zoom out
    const parentCircle = g
      .append('circle')
      .datum(root as AugmentedNode)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .style('cursor', 'default')

    // Hover handlers
    const container = svg.parentElement
    const tooltip = tooltipRef

    path
      .on('mouseenter', function (event: MouseEvent, d: AugmentedNode) {
        // Dim unrelated arcs
        path.attr('fill-opacity', (p: AugmentedNode) => {
          if (!arcVisible(p.current)) return 0
          if (p === d) return 0.9
          const ancestors = (p as d3.HierarchyNode<HierarchyNode>).ancestors()
          if (ancestors.includes(d as d3.HierarchyNode<HierarchyNode>)) return d.children ? 0.7 : 0.55
          return 0.15
        })

        if (tooltip && container) {
          tooltip.textContent = ''
          const strong = document.createElement('strong')
          strong.textContent = d.data.category_name
          tooltip.appendChild(strong)
          tooltip.appendChild(document.createElement('br'))
          tooltip.appendChild(
            document.createTextNode(formatUsd(Math.abs(d.value ?? d.data.total_amount_debit))),
          )
          const parentRect = container.getBoundingClientRect()
          tooltip.style.left = `${event.clientX - parentRect.left + 12}px`
          tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
          tooltip.style.opacity = '1'
        }
      })
      .on('mousemove', function (event: MouseEvent) {
        if (tooltip && container) {
          const parentRect = container.getBoundingClientRect()
          tooltip.style.left = `${event.clientX - parentRect.left + 12}px`
          tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
        }
      })
      .on('mouseleave', function () {
        path.attr('fill-opacity', (d: AugmentedNode) =>
          arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0,
        )
        if (tooltip) tooltip.style.opacity = '0'
      })

    // Click / zoom function (Observable pattern)
    function clicked(_event: Event, p: AugmentedNode) {
      parentCircle.datum(p.parent || root)
      parentCircle.style('cursor', p === (root as AugmentedNode) ? 'default' : 'pointer')

      // Compute target coordinates
      ;(root as AugmentedNode).each((d: unknown) => {
        const node = d as AugmentedNode
        node.target = {
          x0: Math.max(0, Math.min(1, (node.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (node.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, node.y0 - p.depth),
          y1: Math.max(0, node.y1 - p.depth),
        }
      })

      const t = g.transition().duration(DURATION).ease(d3.easeCubicInOut)

      path
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(t as any)
        .tween('data', (d: AugmentedNode) => {
          const i = d3.interpolate(d.current, d.target)
          return (t2: number) => {
            d.current = i(t2)
          }
        })
        .filter(function (this: SVGPathElement, d: AugmentedNode) {
          return !!(+(this.getAttribute('fill-opacity') ?? 0) || arcVisible(d.target))
        })
        .attr('fill-opacity', (d: AugmentedNode) => (arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0))
        .attr('pointer-events', (d: AugmentedNode) => (arcVisible(d.target) ? 'auto' : 'none'))
        .attrTween('d', (d: AugmentedNode) => () => arc(d.current)!)

      label
        .filter(function (this: SVGTextElement, d: AugmentedNode) {
          return !!(+(this.getAttribute('fill-opacity') ?? 0) || labelVisible(d.target))
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(t as any)
        .attr('fill-opacity', (d: AugmentedNode) => +labelVisible(d.target))
        .attrTween('transform', (d: AugmentedNode) => () => labelTransform(d.current))

      // Update center display
      setCenterName(p.data.category_id === 0 ? 'Total' : p.data.category_name)
      setCenterValue(p.value ?? 0)

      // Build breadcrumb path
      const ancestors: Array<{ name: string; node: unknown }> = []
      let cur: d3.HierarchyNode<HierarchyNode> | null = p
      while (cur) {
        if (cur.data.category_id !== 0) {
          ancestors.unshift({ name: cur.data.category_name, node: cur })
        }
        cur = cur.parent
      }
      setBreadcrumb(ancestors)

      // Notify parent (skip synthetic root and synthetic "Other" children)
      if (p.data.category_id > 0) {
        props.onSliceClick?.(p.data as unknown as BudgetCategorySummary)
      }
    }

    // Wire click handlers
    path.filter((d: AugmentedNode) => !!d.children).on('click', clicked)
    // eslint-disable-next-line solid/reactivity
    parentCircle.on('click', function (this: SVGCircleElement, event: MouseEvent) {
      clicked(event, d3.select<SVGCircleElement, AugmentedNode>(this).datum())
    })

    // Expose zoom function and root for breadcrumb navigation
    rootNode = root as AugmentedNode
    // eslint-disable-next-line solid/reactivity
    zoomTo = (node: unknown) => clicked(new MouseEvent('click'), node as AugmentedNode)
  })

  const id = () => props.dataTestId ?? 'budget-category-sunburst'

  return (
    <div data-testid={id()} class="relative">
      <Show when={props.isLoading}>
        <div class="flex flex-col items-center justify-center gap-3 py-4">
          <Skeleton class="size-[200px] rounded-full" />
        </div>
      </Show>

      {/* Breadcrumb */}
      <Show when={breadcrumb().length > 0}>
        <div
          class="flex items-center gap-1 text-xs text-muted-foreground min-h-[20px] px-1 mb-1 flex-wrap"
          data-testid={`${id()}-breadcrumb`}
        >
          <button
            class="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => rootNode && zoomTo?.(rootNode)}
          >
            All
          </button>
          <For each={breadcrumb()}>
            {(crumb, index) => (
              <>
                <ChevronRightIcon class="size-3 shrink-0" />
                <Show
                  when={index() === breadcrumb().length - 1}
                  fallback={
                    <button
                      class="hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => zoomTo?.(crumb.node)}
                    >
                      {crumb.name}
                    </button>
                  }
                >
                  <span class="text-foreground font-medium">{crumb.name}</span>
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>

      {/* SVG + center overlay */}
      <div class="relative w-full max-w-[280px] mx-auto">
        <svg ref={(el) => (svgRef = el)} class="text-foreground w-full block" data-testid={`${id()}-chart`} />

        {/* Center overlay */}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="flex flex-col items-center text-center" style={{ width: '33%' }}>
            <div class="font-semibold text-foreground leading-tight w-full truncate text-[10px]">
              {centerName()}
            </div>
            <div class="text-muted-foreground font-medium mt-0.5 text-[9px]">{formatUsd(centerValue())}</div>
            <Show when={props.timeFrame && props.date}>
              <div class="text-muted-foreground mt-0.5 text-[8px] opacity-70">
                {getPeriodLabel(props.timeFrame!, props.date!)}
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={(el) => (tooltipRef = el)}
        class="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity"
      />
    </div>
  )
}
