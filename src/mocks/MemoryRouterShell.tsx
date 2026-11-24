import { createRouter, memoryHistory } from '@solidjs/router'
import type { JSX } from '@solidjs/web'

/**
 * Renders `children` as the root layout of a single-route memory router, for
 * components that need router context (plain `<a>` link state, `useNavigate`,
 * `useLocation`) in unit tests and stories. Router 2 has no `<MemoryRouter>`:
 * routers are config instances, so each shell builds its own.
 */
export default function MemoryRouterShell(props: { initialPath?: string; children: JSX.Element }) {
  const Router = createRouter({
    routes: [{ path: '*', component: () => null }],
    history: memoryHistory(props.initialPath ?? '/'),
  })
  return <Router>{() => props.children}</Router>
}
