import { A, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { loginRequest, persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { DEFAULT_AUTHENTICATED_ROUTE, buildAuthHref } from '@utils/authRoutes'
import { isValidEmail } from '@utils/validateEmail'
import { devConsole } from '@utils/devConsole'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { ErrorCallout } from '@components/shared/ErrorCallout'
import { EmailField } from './EmailField'
import { PasswordField } from './PasswordField'

export default function Login() {
  const [searchParams] = useSearchParams()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [showPw, setShowPw] = createSignal(false)
  const [focusedField, setFocusedField] = createSignal<'email' | 'password' | null>(null)

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const registerHref = createMemo(() => buildAuthHref('/register', searchParams.redirect))

  const resetSuccess = createMemo(() => searchParams.resetSuccess === '1')
  const registered = createMemo(() => searchParams.registered === '1')

  const emailTrimmed = () => email().trim()

  const emailFormatError = createMemo(() => {
    const e = emailTrimmed()
    if (!e) return null
    if (!isValidEmail(e)) return 'Please enter a valid email address (e.g. name@example.com).'
    return null
  })

  const [sessionError, setSessionError] = createSignal('')

  const loginMut = useMutation(() => ({
    mutationKey: mutationKeys.login,
    mutationFn: async () => loginRequest(emailTrimmed(), password()),
    onSuccess: (data) => {
      // Never log `data` — it carries the session bearer token. devConsole is
      // dev-only, but a token in a console transcript is still a token.
      devConsole('log', 'Login successful')

      if (!persistSession(data.user, data.token)) {
        setSessionError('Signed in, but the account details from the server were unreadable.')
        return
      }

      setSessionError('')
      const path = redirectTarget()
      window.location.replace(`${window.location.origin}${path}`)
    },
  }))

  const isDisabled = () =>
    loginMut.isPending || !emailTrimmed() || !password().trim() || !isValidEmail(emailTrimmed())

  const errorDescription = createMemo(() => {
    if (!loginMut.isError || !loginMut.error) return ''
    return extractApiErrorMessage(loginMut.error)
  })

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <Card class="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle class="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <Show when={resetSuccess()}>
            <Alert class="mb-4" data-testid="login-reset-success">
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>Sign in with your new password.</AlertDescription>
            </Alert>
          </Show>
          <Show when={registered()}>
            <Alert class="mb-4" data-testid="login-registered-success">
              <AlertTitle>Account created</AlertTitle>
              <AlertDescription>Sign in with the email and password you just set up.</AlertDescription>
            </Alert>
          </Show>
          <Show when={loginMut.isError}>
            <div class="mb-4">
              <ErrorCallout title="Login failed" description={errorDescription()} data-testid="login-error" />
            </div>
          </Show>
          <Show when={sessionError()}>
            <div class="mb-4">
              <ErrorCallout
                title="Could not start your session"
                description={sessionError()}
                data-testid="login-session-error"
              />
            </div>
          </Show>
          <form
            class="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (isDisabled()) return
              loginMut.mutate()
            }}
          >
            <EmailField
              id="login-email"
              label="Email"
              helperText="The address you registered with."
              errorTestId="login-email-error"
              autocomplete="username"
              value={email()}
              onInput={(v) => {
                setEmail(v)
                if (loginMut.isError) loginMut.reset()
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField() === 'email'}
              disabled={loginMut.isPending}
              hasError={!!emailFormatError()}
              errorMessage={emailFormatError()}
              testid="login-email-input"
            />
            <PasswordField
              id="login-password"
              label="Password"
              placeholder="Enter your password"
              value={password()}
              onInput={(v) => {
                setPassword(v)
                if (loginMut.isError) loginMut.reset()
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              show={showPw()}
              onToggleShow={() => setShowPw((p) => !p)}
              error={null}
              focused={focusedField() === 'password'}
              disabled={loginMut.isPending}
              testid="login-password-input"
              autocomplete="current-password"
            />
            <Button type="submit" disabled={isDisabled()}>
              {loginMut.isPending ? 'Signing in…' : 'Login'}
            </Button>
            <div class="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <A
                href={registerHref()}
                class="hover:underline font-medium text-foreground"
                data-testid="login-register-link"
              >
                Create an account
              </A>
              <A href="/password/reset" class="hover:underline" data-testid="login-forgot-link">
                Forgot password?
              </A>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
