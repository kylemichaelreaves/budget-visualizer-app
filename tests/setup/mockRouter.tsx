import type { ParentProps } from 'solid-js'
import { vi } from 'vitest'

/**
 * Mutable stand-in for `@solidjs/router`, for components that only read the
 * URL and navigate. Use it as
 *
 *   vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())
 *
 * and set `routerState` in `beforeEach` — the hooks read it lazily, so a test
 * can change the URL before it renders.
 */
export const routerState = {
  navigate: vi.fn<(to: string, options?: { replace?: boolean }) => void>(),
  searchParams: {} as Record<string, string | undefined>,
  params: {} as Record<string, string | undefined>,
  locationSearch: '',
}

export function resetRouterState(): void {
  routerState.navigate.mockReset()
  routerState.searchParams = {}
  routerState.params = {}
  routerState.locationSearch = ''
}

type AProps = ParentProps<{ href: string; class?: string; 'data-testid'?: string }>

export function mockRouterModule() {
  return {
    useNavigate: () => routerState.navigate,
    useSearchParams: () => [routerState.searchParams, vi.fn()],
    useParams: () => routerState.params,
    useLocation: () => ({
      get search() {
        return routerState.locationSearch
      },
      pathname: '/',
    }),
    A: (props: AProps) => (
      <a href={props.href} class={props.class} data-testid={props['data-testid']}>
        {props.children}
      </a>
    ),
  }
}
