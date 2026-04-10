import type { JSX } from 'solid-js'
import { createSignal, onMount } from 'solid-js'

/** Dynamically imports devtools only in dev. */
export default function QueryDevtools(): JSX.Element {
  const [panel, setPanel] = createSignal<JSX.Element | null>(null)

  onMount(() => {
    if (!import.meta.env.DEV) return
    void import('@tanstack/solid-query-devtools').then(({ SolidQueryDevtools }) => {
      setPanel(() => <SolidQueryDevtools initialIsOpen={false} />)
    })
  })

  return <>{panel()}</>
}
