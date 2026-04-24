import type { JSX } from 'solid-js'
import type { GenealogyNode } from '../../types/genealogy'

export const PERSON_CARD_WIDTH = 120
export const PERSON_CARD_HEIGHT = 64

export default function PersonCard(props: {
  node: GenealogyNode
  isSelected: boolean
  onEnter: (node: GenealogyNode, event: MouseEvent) => void
  onMove: (node: GenealogyNode, event: MouseEvent) => void
  onLeave: () => void
  ref?: (el: HTMLDivElement | undefined) => void
}): JSX.Element {
  const lifespan = () => {
    const b = props.node.birthYear ?? '?'
    const d = props.node.deathYear ?? ''
    return d ? `${b}–${d}` : `${b}`
  }

  return (
    <div
      ref={(el) => props.ref?.(el)}
      class="rounded-md border px-2 py-1.5 text-foreground transition-colors cursor-pointer overflow-hidden"
      classList={{
        'bg-card border-border hover:bg-popover hover:border-[var(--chart-1)]': !props.isSelected,
        'bg-popover border-[var(--chart-1)] shadow-[inset_3px_0_0_var(--chart-1)]': props.isSelected,
      }}
      style={{ width: `${PERSON_CARD_WIDTH}px`, height: `${PERSON_CARD_HEIGHT}px` }}
      onMouseEnter={(e) => props.onEnter(props.node, e)}
      onMouseMove={(e) => props.onMove(props.node, e)}
      onMouseLeave={() => props.onLeave()}
      data-testid={`genealogy-person-${props.node.id}`}
    >
      <div class="text-[13px] font-semibold leading-tight truncate">{props.node.fullName}</div>
      <div class="text-[12px] text-muted-foreground leading-tight">{lifespan()}</div>
      <div class="text-[12px] italic text-muted-foreground leading-tight truncate">
        {props.node.birthLocation}
      </div>
    </div>
  )
}
