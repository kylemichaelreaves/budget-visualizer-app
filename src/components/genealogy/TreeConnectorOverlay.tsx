import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import type { GenealogyNode } from '../../types/genealogy'
import type { LayoutNode } from './useTreeLayout'
import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from './PersonCard'

/**
 * SVG overlay that draws cubic-bezier connector paths between each child and
 * its parent in a layout. Pure render — no event handlers (`pointer-events:none`).
 */
export default function TreeConnectorOverlay(props: {
  nodes: GenealogyNode[]
  layout: LayoutNode[]
  width: number
  height: number
}): JSX.Element {
  const layoutById = createMemo(() => new Map(props.layout.map((l) => [l.node.id, l])))

  return (
    <svg
      class="absolute inset-0 pointer-events-none"
      width={props.width}
      height={props.height}
      aria-hidden="true"
    >
      <For each={props.nodes}>
        {(node) => {
          const pair = createMemo(() => {
            if (!node.parentId) return null
            const parent = layoutById().get(node.parentId)
            const child = layoutById().get(node.id)
            if (!parent || !child) return null
            return { parent, child }
          })
          return (
            <Show when={pair()}>
              {(p) => {
                const x1 = p().parent.x + PERSON_CARD_WIDTH / 2
                const y1 = p().parent.y + PERSON_CARD_HEIGHT
                const x2 = p().child.x + PERSON_CARD_WIDTH / 2
                const y2 = p().child.y
                const my = (y1 + y2) / 2
                const d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`
                return (
                  <path d={d} stroke="var(--chart-1)" stroke-opacity="0.6" stroke-width="1.5" fill="none" />
                )
              }}
            </Show>
          )
        }}
      </For>
    </svg>
  )
}
