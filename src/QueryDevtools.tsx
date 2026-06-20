import { type Component, type JSX, createSignal, ErrorBoundary, onMount, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { devConsole } from '@utils/devConsole'

type DevtoolsProps = { initialIsOpen?: boolean }

/**
 * Dynamically imports the TanStack Query devtools only in dev.
 *
 * The devtools component is rendered via `<Dynamic>` inside this component's
 * own reactive scope (a child of `QueryClientProvider`), NOT created inside the
 * async `.then()` callback — otherwise it loses the owner/context and
 * `useQueryClient()` throws "No QueryClient set". That throw happens during the
 * reactive update queue and aborts in-flight route transitions (navigation
 * silently freezes until a manual refresh). The `ErrorBoundary` is a belt-and-
 * suspenders guard so a devtools failure can never break app navigation again.
 */
export default function QueryDevtools(): JSX.Element {
  const [comp, setComp] = createSignal<Component<DevtoolsProps> | null>(null)

  onMount(() => {
    if (!import.meta.env.DEV) return
    void import('@tanstack/solid-query-devtools')
      .then(({ SolidQueryDevtools }) => setComp(() => SolidQueryDevtools as Component<DevtoolsProps>))
      .catch((err) => devConsole('warn', 'Failed to load TanStack Query devtools chunk:', err))
  })

  return (
    <ErrorBoundary fallback={null}>
      <Show when={comp()}>{(C) => <Dynamic component={C()} initialIsOpen={false} />}</Show>
    </ErrorBoundary>
  )
}
