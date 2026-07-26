import { A, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { loginRequest, persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { isValidEmail } from '@utils/validateEmail'
import { devConsole } from '@utils/devConsole'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

const DEFAULT_AUTHENTICATED_ROUTE = '/budget-visualizer/transactions'

export default function Login() {
  const [searchParams] = useSearchParams()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const registerHref = createMemo(() => {
    const safe = safeRedirectPath(searchParams.redirect)
    if (!safe) return '/register'
    const qs = new URLSearchParams({ redirect: safe })
    return `/register?${qs.toString()}`
  })

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
          {loginMut.isError ? (
            <Alert variant="destructive" class="mb-4">
              <AlertTitle>Login failed</AlertTitle>
              <AlertDescription>{errorDescription()}</AlertDescription>
            </Alert>
          ) : null}
          <Show when={sessionError()}>
            <Alert variant="destructive" class="mb-4" data-testid="login-session-error">
              <AlertTitle>Could not start your session</AlertTitle>
              <AlertDescription>{sessionError()}</AlertDescription>
            </Alert>
          </Show>
          <form
            class="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (isDisabled()) return
              loginMut.mutate()
            }}
          >
            <div class="flex flex-col gap-2">
              <Label for="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autocomplete="username"
                inputmode="email"
                placeholder="name@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                aria-invalid={emailFormatError() ? 'true' : undefined}
                aria-describedby={emailFormatError() ? 'login-email-error' : undefined}
              />
              <Show when={emailFormatError()}>
                <p id="login-email-error" class="text-sm text-destructive" role="alert">
                  {emailFormatError()}
                </p>
              </Show>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autocomplete="current-password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
            </div>
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
