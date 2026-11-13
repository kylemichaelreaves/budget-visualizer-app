import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Button } from '@components/ui/button'
import ClearFilterButton from '@components/shared/ClearFilterButton'
import { ChevronLeftIcon, ChevronRightIcon } from '@shared/icons'

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
        <ChevronLeftIcon class="size-4 mr-1" />
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
        <ChevronRightIcon class="size-4 ml-1" />
      </Button>
      <Show when={props.onClear}>
        {(clear) => <ClearFilterButton onClick={() => clear()()} dataTestId="period-header-clear" />}
      </Show>
    </div>
  )
}
