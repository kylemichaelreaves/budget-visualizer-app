import type { JSX } from 'solid-js'
import { createEffect, createMemo } from 'solid-js'
import { useElementSize } from '@composables/useElementSize'
import type { GenealogyNode } from '../../types/genealogy'
import { PERSON_CARD_HEIGHT } from './PersonCard'
import { useTreeLayout } from './useTreeLayout'
import Tooltip from './Tooltip'
import TreeCardLayer from './TreeCardLayer'
import TreeConnectorOverlay from './TreeConnectorOverlay'
import { useSelection } from './SelectionContext'
import { useGenealogyHover } from './useGenealogyHover'

const BOTTOM_PADDING = 16
const MIN_HEIGHT = 320

export default function FamilyTree(props: { nodes: GenealogyNode[] }): JSX.Element {
  const [dims, attachWrapper] = useElementSize()
  const { selectedId } = useSelection()
  const hover = useGenealogyHover()

  const layout = createMemo(() => {
    const width = dims().w
    if (width <= 0) return []
    return useTreeLayout(props.nodes, { width })
  })

  const totalHeight = createMemo(() => {
    const items = layout()
    if (!items.length) return 0
    return Math.max(...items.map((l) => l.y + PERSON_CARD_HEIGHT)) + BOTTOM_PADDING
  })

  const cardRefs = new Map<string, HTMLDivElement>()

  function registerCardRef(id: string, el: HTMLDivElement | undefined) {
    if (el) cardRefs.set(id, el)
    else cardRefs.delete(id)
  }

  createEffect(() => {
    const id = selectedId()
    if (!id) return
    cardRefs.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  return (
    <div
      ref={(el) => attachWrapper(el)}
      class="relative w-full h-full overflow-auto bg-card rounded-md border border-border"
      data-testid="genealogy-family-tree"
    >
      <div class="relative w-full" style={{ height: `${totalHeight()}px`, 'min-height': `${MIN_HEIGHT}px` }}>
        <TreeConnectorOverlay nodes={props.nodes} layout={layout()} width={dims().w} height={totalHeight()} />
        <TreeCardLayer
          layout={layout()}
          selectedId={selectedId()}
          onEnter={hover.onEnter}
          onMove={hover.onMove}
          onLeave={hover.onLeave}
          registerCardRef={registerCardRef}
        />
      </div>
      <Tooltip state={hover.tooltip()} testid="genealogy-tree-tooltip" />
    </div>
  )
}
