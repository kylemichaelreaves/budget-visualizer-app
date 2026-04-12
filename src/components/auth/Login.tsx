import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { loginRequest, persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
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

  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const loginMut = useMutation(() => ({
    mutationKey: mutationKeys.login,
    mutationFn: async () => loginRequest(username(), password()),
    onSuccess: (data) => {
      devConsole('log', 'Login successful', data)
      persistSession(data.user, data.token)
      navigate(redirectTarget(), { replace: true })
    },
  }))

  const isDisabled = () => loginMut.isPending || !username().trim() || !password().trim()

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
              loginMut.mutate()
            }}
          >
            <div class="flex flex-col gap-2">
              <Label for="login-username">Username</Label>
              <Input
                id="login-username"
                autocomplete="username"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
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
                    if (!isDisabled()) loginMut.mutate()
                  }
                }}
              />
            </div>
            <Button type="submit" disabled={isDisabled()}>
              {loginMut.isPending ? 'Signing in…' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
