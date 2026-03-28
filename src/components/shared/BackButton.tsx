import type { JSX } from 'solid-js'
import { Button } from '@components/ui/button'

export default function BackButton(props: { dataTestId?: string }): JSX.Element {
  return (
    <Button
      id="back-button"
      variant="ghost"
      data-test-id={props.dataTestId ?? ''}
      onClick={() => window.history.back()}
    >
      Go Back
    </Button>
  )
}
