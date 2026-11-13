import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { createUser } from '@api/users/createUser'
import { parseCreateUserSession } from '@api/users/createUserResponse'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { DEFAULT_AUTHENTICATED_ROUTE, buildAuthHref } from '@utils/authRoutes'
import { isValidEmail } from '@utils/validateEmail'
import { createNewPasswordFields } from './createNewPasswordFields'

export function useCreateUserRegistration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [focusedField, setFocusedField] = createSignal<'username' | 'email' | 'password' | 'confirm' | null>(
    null,
  )
  const [submitted, setSubmitted] = createSignal(false)
  const pw = createNewPasswordFields(submitted)

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const signInHref = createMemo(() => buildAuthHref('/login', searchParams.redirect))

  const usernameError = createMemo(() => (submitted() && !username().trim() ? 'Username is required.' : null))
  const emailError = createMemo(() => {
    if (!submitted()) return null
    const e = email().trim()
    if (!e) return 'Email is required.'
    if (!isValidEmail(e)) return 'Please enter a valid email address (e.g. name@example.com).'
    return null
  })

  const hasFieldErrors = () => !!(usernameError() || emailError() || pw.pwError() || pw.cfError())

  const createMut = useMutation(() => ({
    mutationKey: mutationKeys.createUser,
    mutationFn: async () =>
      createUser({
        username: username().trim(),
        email: email().trim(),
        password: pw.password(),
      }),
    onSuccess: (data: unknown) => {
      const session = parseCreateUserSession(data)
      // `parseCreateUserSession` already normalized the user, so persistSession
      // should not reject it — but fall through to the sign-in prompt rather
      // than navigating into the app with no session if it ever does.
      if (session && persistSession(session.user, session.token)) {
        navigate(redirectTarget(), { replace: true })
        return
      }

      const qs = new URLSearchParams({ registered: '1' })
      const safe = safeRedirectPath(searchParams.redirect)
      if (safe) qs.set('redirect', safe)
      navigate(`/login?${qs.toString()}`, { replace: true })
    },
  }))

  const apiError = createMemo(() => {
    if (!createMut.isError || !createMut.error) return ''
    return extractApiErrorMessage(createMut.error)
  })

  const hasAnyError = () => hasFieldErrors() || createMut.isError

  const formBasicsOk = () => username().trim().length > 0 && isValidEmail(email().trim()) && pw.isValid()

  const isDisabled = () => createMut.isPending

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!formBasicsOk()) return
    createMut.mutate()
  }

  function clearApiErrorOnInput() {
    if (createMut.isError) createMut.reset()
  }

  return {
    username,
    setUsername,
    email,
    setEmail,
    ...pw,
    focusedField,
    setFocusedField,
    usernameError,
    emailError,
    createMut,
    apiError,
    hasAnyError,
    isDisabled,
    handleSubmit,
    clearApiErrorOnInput,
    signInHref,
  }
}
