/* @refresh reload */
import { QueryClientProvider } from '@tanstack/solid-query'
import { Show } from 'solid-js'
import { render } from 'solid-js/web'
import { queryClient } from '@api/queryClient'
import { setUnauthorizedHandler } from '@api/httpClient'
import { hydrateAuthFromStorage, logout } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import QueryDevtools from './QueryDevtools'
import App from './App'
import './index.css'

hydrateAuthFromStorage()

function assignLocationToLoginAfterUnauthorized(): void {
  const path = window.location.pathname
  const search = window.location.search

  if (path !== '/login') {
    window.location.assign(`/login?redirect=${encodeURIComponent(`${path}${search}`)}`)
    return
  }

  const params = new URLSearchParams(search.slice(1))
  // URLSearchParams.get already returns a decoded string — do not decode again.
  const raw = params.get('redirect')
  if (!raw) {
    window.location.assign('/login')
    return
  }

  // Sanitize first so the self-loop guard catches values that only resolve to
  // `/login` after `safeRedirectPath` trims whitespace (e.g. `%20/login`).
  const safe = safeRedirectPath(raw)
  if (!safe || safe.startsWith('/login')) {
    window.location.assign('/login')
    return
  }

  window.location.assign(`/login?redirect=${encodeURIComponent(safe)}`)
}

setUnauthorizedHandler(() => {
  logout()
  queryClient.clear()
  assignLocationToLoginAfterUnauthorized()
})

const root = document.getElementById('root')

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
      <Show when={import.meta.env.DEV}>
        <QueryDevtools />
      </Show>
    </QueryClientProvider>
  ),
  root!,
)
