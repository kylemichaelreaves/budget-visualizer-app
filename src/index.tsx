/* @refresh reload */
import { QueryClientProvider } from '@tanstack/solid-query'
import { render } from 'solid-js/web'
import { queryClient } from '@api/queryClient'
import { setUnauthorizedHandler } from '@api/httpClient'
import { hydrateAuthFromStorage, logout } from '@stores/authStore'
import App from './App'
import './index.css'

hydrateAuthFromStorage()

setUnauthorizedHandler(() => {
  logout()
  queryClient.clear()
  const redirect = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
})

const root = document.getElementById('root')

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ),
  root!,
)
