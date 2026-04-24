import type { JSX } from 'solid-js'
import type { GenealogyNode } from '../../types/genealogy'
import MapView from './MapView'

export default function GenealogyMapPanel(props: { nodes: GenealogyNode[] }): JSX.Element {
  return (
    <div class="relative w-full" data-testid="genealogy-map-panel">
      <div class="flex items-center justify-end mb-2">
        <button
          type="button"
          class="px-2 py-1 text-xs rounded-md border border-border bg-card text-muted-foreground cursor-not-allowed opacity-60"
          disabled
          title="Timeline mode coming in a follow-up PR"
          data-testid="genealogy-timeline-toggle"
        >
          Timeline · Coming soon
        </button>
      </div>
      <MapView nodes={props.nodes} />
    </div>
  )
}
