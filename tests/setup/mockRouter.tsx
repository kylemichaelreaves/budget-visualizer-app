import type { ParentProps } from 'solid-js'
import type { JSX } from '@solidjs/web'
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
  pathname: '/',
  locationSearch: '',
}

export function resetRouterState(): void {
  routerState.navigate.mockReset()
  routerState.searchParams = {}
  routerState.params = {}
  routerState.pathname = '/'
  routerState.locationSearch = ''
}

type AProps = ParentProps<{
  href: string
  class?: string
  'data-testid'?: string
  'aria-current'?: JSX.AnchorHTMLAttributes<HTMLAnchorElement>['aria-current']
}>

export function mockRouterModule() {
  return {
    useNavigate: () => routerState.navigate,
    useSearchParams: () => [routerState.searchParams, vi.fn()],
    useParams: () => routerState.params,
    useLocation: () => ({
      get search() {
        return routerState.locationSearch
      },
      pathname: routerState.pathname,
    }),
    A: (props: AProps) => (
      <a
        href={props.href}
        class={props.class}
        data-testid={props['data-testid']}
        aria-current={
          new URL(props.href, 'http://localhost').pathname === routerState.pathname ? 'page' : undefined
        }
      >
        {props.children}
      </a>
    ),
  }
}
