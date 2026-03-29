import type { JSX } from 'solid-js'
import { Button } from '@components/ui/button'

export default function ClearFilterButton(props: { onClick: () => void; dataTestId?: string }): JSX.Element {
  return (
    <Button
      variant="outline"
      size="sm"
      class="h-8 px-3"
      onClick={props.onClick}
      data-testid={props.dataTestId}
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
  )
}
