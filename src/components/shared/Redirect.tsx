import { useNavigate } from '@solidjs/router'

/**
 * Router 2 dropped `<Navigate>`: a redirect on render is a `navigate()` during
 * component setup. `replace` keeps the redirecting URL out of history, which is
 * what `<Navigate>` did.
 */
export default function Redirect(props: { href: string }) {
  const navigate = useNavigate()
  // eslint-disable-next-line solid/reactivity -- a redirect fires once, on mount
  navigate(props.href, { replace: true })
  return null
}
