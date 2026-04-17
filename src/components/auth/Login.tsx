import { A, useNavigate, useSearchParams } from '@solidjs/router'
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const resetSuccess = createMemo(() => searchParams.resetSuccess === '1')
  const registered = createMemo(() => searchParams.registered === '1')

  const loginMut = useMutation(() => ({
    mutationKey: mutationKeys.login,
    mutationFn: async () => loginRequest(email(), password()),
    onSuccess: (data) => {
      devConsole('log', 'Login successful', data)
      persistSession(data.user, data.token)
      navigate(redirectTarget(), { replace: true })
    },
  }))

  const isDisabled = () =>
    loginMut.isPending || !email().trim() || !password().trim() || !isValidEmail(email().trim())

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
                autocomplete="email"
                inputmode="email"
                placeholder="name@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
            </div>
            <div class="flex flex-col gap-2">
              <Label for="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autocomplete="current-password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (isDisabled()) return
                    loginMut.mutate()
                  }
                }}
              />
            </div>
            <Button type="submit" disabled={isDisabled()}>
              {loginMut.isPending ? 'Signing in…' : 'Login'}
            </Button>
            <div class="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <A
                href="/register"
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
