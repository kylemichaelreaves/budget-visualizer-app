import { A } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { requestPasswordReset } from '@api/auth/requestPasswordReset'
import { isValidEmail } from '@utils/validateEmail'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = createSignal('')

  const resetMut = useMutation(() => ({
    mutationKey: mutationKeys.passwordResetRequest,
    mutationFn: async () => requestPasswordReset(email().trim()),
  }))

  const submitted = () => resetMut.isSuccess
  const isDisabled = () => resetMut.isPending || !isValidEmail(email())
  const errorDescription = createMemo(() => {
    if (!resetMut.isError || !resetMut.error) return ''
    return extractApiErrorMessage(resetMut.error)
  })

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <Card class="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle class="text-xl">Forgot password</CardTitle>
        </CardHeader>
        <CardContent>
          <Show when={submitted()} fallback={null}>
            <Alert class="mb-4" data-testid="forgot-password-success">
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>
                If an account exists for that email, we've sent a reset link. It expires in 15 minutes.
              </AlertDescription>
            </Alert>
          </Show>

          <Show when={!submitted()}>
            <p class="text-muted-foreground mb-4 text-sm">
              Enter the email on your account and we'll send a one-time link to reset your password.
            </p>

            <Show when={resetMut.isError}>
              <Alert variant="destructive" class="mb-4" data-testid="forgot-password-error">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{errorDescription()}</AlertDescription>
              </Alert>
            </Show>

            <form
              class="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!isDisabled()) resetMut.mutate()
              }}
            >
              <div class="flex flex-col gap-2">
                <Label for="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autocomplete="email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  data-testid="forgot-password-email-input"
                />
              </div>
              <Button type="submit" disabled={isDisabled()} data-testid="forgot-password-submit">
                {resetMut.isPending ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </Show>

          <div class="mt-6 text-center text-sm text-muted-foreground">
            <A href="/login" class="hover:underline">
              Back to sign in
            </A>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
