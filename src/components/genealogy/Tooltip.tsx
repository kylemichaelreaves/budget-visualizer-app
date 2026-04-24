import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import CursorTooltip from '@components/shared/CursorTooltip'
import type { GenealogyNode } from '../../types/genealogy'

export type TooltipState = {
  node: GenealogyNode
  x: number
  y: number
} | null

export default function Tooltip(props: { state: TooltipState; testid?: string }): JSX.Element {
  const position = () => (props.state ? { x: props.state.x, y: props.state.y } : null)
  const node = () => props.state?.node

  return (
    <CursorTooltip position={position()} dataTestId={props.testid ?? 'genealogy-tooltip'}>
      <Show when={node()}>
        {(n) => (
          <>
            <div class="font-semibold text-[13px]">{n().fullName}</div>
            <div class="text-muted-foreground">
              <Show when={n().birthYear !== null} fallback={<>Birth: unknown</>}>
                Born {n().birthYear} · {n().birthLocation}
              </Show>
            </div>
            <Show when={n().deathYear !== null}>
              <div class="text-muted-foreground">
                Died {n().deathYear}
                <Show when={n().deathLocation}>
                  {' · '}
                  {n().deathLocation}
                </Show>
              </div>
            </Show>
          </>
        )}
      </Show>
    </CursorTooltip>
  )
}
