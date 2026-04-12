import type { JSX } from 'solid-js'
import { createSignal, onMount } from 'solid-js'
import { devConsole } from '@utils/devConsole'

/** Dynamically imports devtools only in dev. */
export default function QueryDevtools(): JSX.Element {
  const [panel, setPanel] = createSignal<JSX.Element | null>(null)

  onMount(() => {
    if (!import.meta.env.DEV) return
    void import('@tanstack/solid-query-devtools')
      .then(({ SolidQueryDevtools }) => {
        setPanel(() => <SolidQueryDevtools initialIsOpen={false} />)
      })
      .catch((err) => {
        devConsole('warn', 'Failed to load TanStack Query devtools chunk:', err)
      })
  })

  return <>{panel()}</>
}
