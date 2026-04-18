import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { createUser } from '@api/users/createUser'
import { parseCreateUserSession } from '@api/users/createUserResponse'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { isValidEmail } from '@utils/validateEmail'
import { Button } from '@components/ui/button'
import { User as UserIcon, UserPlus, Loader2, CheckCircle2 } from 'lucide-solid'
import { CenteredCardLayout } from '@components/shared/CenteredCardLayout'
import { IconHeading } from '@components/shared/IconHeading'
import { Divider } from '@components/shared/Divider'
import { ErrorCallout } from '@components/shared/ErrorCallout'
import { EmailField } from './EmailField'
import { PasswordField } from './PasswordField'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { AuthTextField } from './AuthTextField'
import { analyzePassword } from './passwordStrength'

const DEFAULT_AUTHENTICATED_ROUTE = '/budget-visualizer/transactions'

export default function CreateUserPage() {
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

  /** Only gate on pending so users can submit an incomplete form and see validation (submitted + errors). */
  const isDisabled = () => createMut.isPending

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!formBasicsOk()) return
    createMut.mutate()
  }

  return (
    <CenteredCardLayout>
      <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-6">
        <IconHeading
          icon={UserPlus}
          title="Create your account"
          description="Enter your details and a strong password to get started."
          hasError={hasAnyError()}
        />

        <Show when={createMut.isError}>
          <ErrorCallout
            title="Could not create account"
            description={apiError()}
            data-testid="register-error"
          />
        </Show>

        <AuthTextField
          id="cu-username"
          label="Username"
          placeholder="Choose a username"
          value={username()}
          onInput={(v) => {
            setUsername(v)
            if (createMut.isError) createMut.reset()
          }}
          onFocus={() => setFocusedField('username')}
          onBlur={() => setFocusedField(null)}
          disabled={createMut.isPending}
          focused={focusedField() === 'username'}
          hasError={!!usernameError()}
          errorMessage={usernameError()}
          icon={UserIcon}
          autocomplete="username"
          testid="register-username-input"
        />

        <EmailField
          id="cu-email"
          label="Email"
          helperText="We'll use this for sign-in and account notices."
          errorTestId="register-email-error"
          value={email()}
          onInput={(v) => {
            setEmail(v)
            if (createMut.isError) createMut.reset()
          }}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          disabled={createMut.isPending}
          focused={focusedField() === 'email'}
          hasError={!!emailError()}
          errorMessage={emailError()}
          testid="register-email-input"
        />

        <div class="flex flex-col gap-2">
          <PasswordField
            id="cu-password"
            label="Password"
            placeholder="Create a strong password"
            value={password()}
            onInput={(v) => {
              setPassword(v)
              if (createMut.isError) createMut.reset()
            }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            show={showPw()}
            onToggleShow={() => setShowPw((p) => !p)}
            error={pwError()}
            focused={focusedField() === 'password'}
            disabled={createMut.isPending}
            testid="register-password-input"
          />
          <PasswordStrengthIndicator
            strength={strength()}
            showRequirements={focusedField() === 'password' || password().length > 0}
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <PasswordField
            id="cu-confirm"
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirm()}
            onInput={(v) => {
              setConfirm(v)
              if (createMut.isError) createMut.reset()
            }}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            show={showCf()}
            onToggleShow={() => setShowCf((p) => !p)}
            error={cfError()}
            success={cfSuccess()}
            focused={focusedField() === 'confirm'}
            disabled={createMut.isPending}
            testid="register-confirm-input"
          />
          <Show when={cfSuccess() && !cfError()}>
            <p class="flex items-center gap-1.5 text-success text-[13px]">
              <CheckCircle2 class="h-3.5 w-3.5 shrink-0" />
              Passwords match
            </p>
          </Show>
        </div>

        <Button
          type="submit"
          disabled={isDisabled()}
          class="w-full rounded-xl py-3 text-[15px] font-semibold"
          data-testid="register-submit"
        >
          <Show when={createMut.isPending} fallback="Create account">
            <Loader2 class="h-4 w-4 animate-spin" />
            Creating account…
          </Show>
        </Button>

        <Divider />

        <p class="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <A href={signInHref()} class="text-primary hover:underline font-medium">
            Sign in
          </A>
        </p>
      </form>
    </CenteredCardLayout>
  )
}
