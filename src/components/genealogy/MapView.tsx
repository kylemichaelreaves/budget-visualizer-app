import type { JSX } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useElementSize } from '@composables/useElementSize'
import type { GenealogyNode } from '../../types/genealogy'
import { createGenealogyMap, type GenealogyMapHandle } from './createGenealogyMap'
import Tooltip from './Tooltip'
import { useSelection } from './SelectionContext'
import { useGenealogyHover } from './useGenealogyHover'

const ASPECT = 0.55 // height / width — fits the southern strip without too much vertical letterboxing

export default function MapView(props: { nodes: GenealogyNode[] }): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  const [dims, attachWrapper] = useElementSize()
  const { selectedId } = useSelection()
  const hover = useGenealogyHover()

  let handle: GenealogyMapHandle | null = null

  createEffect(() => {
    const el = svgEl
    const w = dims().w
    if (!el || w <= 0) return
    const h = Math.max(240, Math.round(w * ASPECT))

    handle?.destroy()
    handle = createGenealogyMap(el, props.nodes, w, h, {
      onNodeEnter: hover.onEnter,
      onNodeMove: hover.onMove,
      onNodeLeave: hover.onLeave,
    })
    handle.setSelected(selectedId())
  })

  // Sync external selection changes (from the tree panel) to the map without re-rendering.
  createEffect(() => {
    handle?.setSelected(selectedId())
  })

  onCleanup(() => {
    handle?.destroy()
    handle = null
  })

  return (
    <div ref={(el) => attachWrapper(el)} class="relative w-full" data-testid="genealogy-map">
      <svg
        ref={(el) => {
          svgEl = el
        }}
        class="block w-full bg-card rounded-md border border-border"
        data-testid="genealogy-map-svg"
      />
      <Tooltip state={hover.tooltip()} testid="genealogy-map-tooltip" />
    </div>
  )
}
