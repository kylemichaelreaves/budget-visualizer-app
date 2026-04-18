import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { createUser } from '@api/users/createUser'
import { parseCreateUserSession } from '@api/users/createUserResponse'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { isValidEmail } from '@utils/validateEmail'
import { analyzePassword } from './passwordStrength'

const DEFAULT_AUTHENTICATED_ROUTE = '/budget-visualizer/transactions'

export function useCreateUserRegistration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [showPw, setShowPw] = createSignal(false)
  const [showCf, setShowCf] = createSignal(false)
  const [focusedField, setFocusedField] = createSignal<'username' | 'email' | 'password' | 'confirm' | null>(
    null,
  )
  const [submitted, setSubmitted] = createSignal(false)

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const signInHref = createMemo(() => {
    const safe = safeRedirectPath(searchParams.redirect)
    if (!safe) return '/login'
    const qs = new URLSearchParams({ redirect: safe })
    return `/login?${qs.toString()}`
  })

  const strength = createMemo(() => analyzePassword(password()))

  const usernameError = createMemo(() => (submitted() && !username().trim() ? 'Username is required.' : null))
  const emailError = createMemo(() => {
    if (!submitted()) return null
    const e = email().trim()
    if (!e) return 'Email is required.'
    if (!isValidEmail(e)) return 'Please enter a valid email address (e.g. name@example.com).'
    return null
  })

  const pwError = createMemo(() => {
    if (!submitted()) return null
    if (strength().score < 2)
      return 'Password is too weak \u2014 meet at least 3 of the 4 requirements below.'
    return null
  })

  const cfError = createMemo(() => {
    if (!submitted()) return null
    if (!confirm()) return 'Please confirm your password.'
    if (password() !== confirm()) return 'Passwords don\u2019t match. Please try again.'
    return null
  })

  const cfSuccess = () => !cfError() && confirm().length > 0 && confirm() === password()

  const hasFieldErrors = () => !!(usernameError() || emailError() || pwError() || cfError())

  const createMut = useMutation(() => ({
    mutationKey: mutationKeys.createUser,
    mutationFn: async () =>
      createUser({
        username: username().trim(),
        email: email().trim(),
        password: password(),
      }),
    onSuccess: (data: unknown) => {
      const session = parseCreateUserSession(data)
      if (session) {
        persistSession(session.user, session.token)
        navigate(redirectTarget(), { replace: true })
      } else {
        const qs = new URLSearchParams({ registered: '1' })
        const safe = safeRedirectPath(searchParams.redirect)
        if (safe) qs.set('redirect', safe)
        navigate(`/login?${qs.toString()}`, { replace: true })
      }
    },
  }))

  const apiError = createMemo(() => {
    if (!createMut.isError || !createMut.error) return ''
    return extractApiErrorMessage(createMut.error)
  })

  const hasAnyError = () => hasFieldErrors() || createMut.isError

  const formBasicsOk = () =>
    username().trim().length > 0 &&
    isValidEmail(email().trim()) &&
    password().length > 0 &&
    confirm().length > 0 &&
    strength().score >= 2 &&
    password() === confirm()

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
    password,
    setPassword,
    confirm,
    setConfirm,
    showPw,
    setShowPw,
    showCf,
    setShowCf,
    focusedField,
    setFocusedField,
    strength,
    usernameError,
    emailError,
    pwError,
    cfError,
    cfSuccess,
    createMut,
    apiError,
    hasAnyError,
    isDisabled,
    handleSubmit,
    clearApiErrorOnInput,
    signInHref,
  }
}
