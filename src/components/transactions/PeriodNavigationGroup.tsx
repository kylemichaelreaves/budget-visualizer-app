import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Button } from '@components/ui/button'

/**
 * Prev / Next / Clear button group for navigating periods.
 *
 * Assumes the backing list is sorted **descending** (newest first).
 * - Prev = go older (higher index)
 * - Next = go newer (lower index)
 */
export default function PeriodNavigationGroup(props: {
  canGoOlder: boolean
  canGoNewer: boolean
  onPrev: () => void
  onNext: () => void
  onClear?: () => void
  dataTestId?: string
}): JSX.Element {
  return (
    <div class="flex items-center gap-1" data-testid={props.dataTestId}>
      <Button
        variant="outline"
        size="sm"
        class="h-8 px-3"
        disabled={!props.canGoOlder}
        onClick={props.onPrev}
        data-testid="period-header-prev"
      >
        <svg
          class="size-4 mr-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Prev
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 px-3"
        disabled={!props.canGoNewer}
        onClick={props.onNext}
        data-testid="period-header-next"
      >
        Next
        <svg
          class="size-4 ml-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
      <Show when={props.onClear}>
        {(clear) => (
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3"
            onClick={() => clear()()}
            data-testid="period-header-clear"
          >
            <svg
              class="size-3.5 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            Clear
          </Button>
        )}
      </Show>
    </div>
  )
}
