import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import './shared-ui.css'

/** Matches Vue: Previous disabled when `isLast`, Next disabled when `isFirst`. */
export default function NavigationButtonGroup(props: {
  label: string
  isFirst: boolean
  isLast: boolean
  goToPrevious: () => void
  goToNext: () => void
  reset?: () => void
  dataTestId?: string
  'aria-label'?: string
}): JSX.Element {
  return (
    <div class="bv-button-group" role="group" data-testid={props.dataTestId} aria-label={props['aria-label']}>
      <button type="button" onClick={() => props.goToPrevious()} disabled={props.isLast}>
        ← Previous {props.label}
      </button>
      <button type="button" onClick={() => props.goToNext()} disabled={props.isFirst}>
        Next {props.label} →
      </button>
      <Show when={props.reset}>
        {(fn) => (
          <button type="button" class="bv-btn-info" onClick={() => fn()()}>
            ✕ Reset {props.label}
          </button>
        )}
      </Show>
    </div>
  )
}
