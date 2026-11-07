import { Navigate } from '@solidjs/router'
import { Show } from 'solid-js'
import { authState } from '@stores/authStore'
import ObservabilityPage from '@components/observability/ObservabilityPage'

/**
 * UX-only guard: the role claim is client-held, so the backend's 403 is the real gate.
 * Reactive (not `onMount`) so a role change while on the page also redirects.
 */
export default function ObservabilityRoute() {
  return (
    <Show
      when={authState.user.role === 'admin'}
      fallback={<Navigate href="/budget-visualizer/transactions" />}
    >
      <ObservabilityPage />
    </Show>
  )
}
