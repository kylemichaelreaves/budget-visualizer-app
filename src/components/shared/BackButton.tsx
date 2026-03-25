import type { JSX } from 'solid-js'

export default function BackButton(props: { dataTestId?: string }): JSX.Element {
  return (
    <button
      id="back-button"
      type="button"
      data-test-id={props.dataTestId ?? ''}
      onClick={() => window.history.back()}
    >
      Go Back
    </button>
  )
}
