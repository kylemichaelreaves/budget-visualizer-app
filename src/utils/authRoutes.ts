import { safeRedirectPath } from '@utils/safeRedirectPath'

/** Where a signed-in user lands when nothing else asked for a page. */
export const DEFAULT_AUTHENTICATED_ROUTE = '/budget-visualizer/transactions'

/**
 * Link to an auth page (`/login`, `/register`) that carries a `redirect` param
 * forward — but only one that passes `safeRedirectPath`, so an open redirect in
 * the current URL can't be laundered into the next page's link.
 */
export function buildAuthHref(path: string, redirect: unknown): string {
  const safe = safeRedirectPath(redirect)
  if (!safe) return path
  return `${path}?${new URLSearchParams({ redirect: safe }).toString()}`
}
