import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import type { GenealogyNode } from '../../../types/genealogy'
import { formatTimelineStepSummary, type GenealogyTimelineStep } from '@genealogy/lib/buildGenealogyTimeline'
import type { GenealogyNodeCursorPointer } from '@genealogy/hooks/useGenealogyNodeCursorTooltip'

type Props = {
  nodes: readonly GenealogyNode[]
  steps: () => readonly GenealogyTimelineStep[]
  stepIndex: () => number
  currentStep: () => GenealogyTimelineStep | null
  onPrev: () => void
  onNext: () => void
  onNodeTooltipEnter: (node: GenealogyNode, event: GenealogyNodeCursorPointer) => void
  onNodeTooltipMove: (node: GenealogyNode, event: GenealogyNodeCursorPointer) => void
  onNodeTooltipLeave: () => void
}

export default function GenealogyMapTimelineRail(props: Props): JSX.Element {
  return (
    <div
      class="pointer-events-auto absolute inset-x-3 top-3 z-10 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm"
      data-testid="genealogy-timeline-overlay"
    >
      <Show
        when={props.steps().length > 0}
        fallback={
          <p class="text-xs text-muted-foreground" data-testid="genealogy-timeline-empty">
            No dated birth or death events in this view.
          </p>
        }
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            class="min-w-0 flex-1"
            onPointerEnter={(e) => {
              const step = props.currentStep()
              if (!step) return
              const node = props.nodes.find((n) => n.id === step.nodeId)
              if (node) props.onNodeTooltipEnter(node, e)
            }}
            onPointerMove={(e) => {
              const step = props.currentStep()
              if (!step) return
              const node = props.nodes.find((n) => n.id === step.nodeId)
              if (node) props.onNodeTooltipMove(node, e)
            }}
            onPointerLeave={() => props.onNodeTooltipLeave()}
          >
            <p
              class="text-lg font-semibold tabular-nums text-foreground"
              data-testid="genealogy-timeline-year"
            >
              {props.currentStep()?.year ?? '—'}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {props.currentStep() ? formatTimelineStepSummary(props.currentStep()!) : ''}
            </p>
            <p class="text-[10px] text-muted-foreground/80" data-testid="genealogy-timeline-position">
              Step {props.stepIndex() + 1} of {props.steps().length}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="genealogy-timeline-prev"
              disabled={props.stepIndex() <= 0}
              onClick={() => props.onPrev()}
            >
              Previous
            </button>
            <button
              type="button"
              class="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="genealogy-timeline-next"
              disabled={props.stepIndex() >= props.steps().length - 1}
              onClick={() => props.onNext()}
            >
              Next
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}
