import { createSignal } from 'solid-js'
import type { GenealogyNode } from '../../types/genealogy'
import { useSelection } from './SelectionContext'
import type { TooltipState } from './Tooltip'

/**
 * Shared hover behavior for both genealogy panels: hovering a node selects it
 * (synced cross-panel via SelectionContext) and shows a tooltip following the
 * cursor; leaving clears both. Each panel keeps its own tooltip overlay so
 * positioning is local, but the hook centralizes the wiring so the two panels
 * cannot drift out of sync.
 */
export function useGenealogyHover() {
  const [tooltip, setTooltip] = createSignal<TooltipState>(null)
  const { setSelectedId } = useSelection()

  return {
    tooltip,
    onEnter(node: GenealogyNode, event: { clientX: number; clientY: number }) {
      setSelectedId(node.id)
      setTooltip({ node, x: event.clientX, y: event.clientY })
    },
    onMove(node: GenealogyNode, event: { clientX: number; clientY: number }) {
      setTooltip({ node, x: event.clientX, y: event.clientY })
    },
    onLeave() {
      setSelectedId(null)
      setTooltip(null)
    },
  }
}
