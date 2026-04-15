import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { confirmPasswordReset } from '@api/auth/confirmPasswordReset'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

const MIN_PASSWORD = 8

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [newPassword, setNewPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [showValidation, setShowValidation] = createSignal(false)

  const token = createMemo(() => {
    const t = searchParams.token
    return typeof t === 'string' ? t : ''
  })

  const passwordError = createMemo(() => {
    const pw = newPassword()
    if (pw.length === 0) return 'New password is required'
    if (pw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters`
    if (confirm().length > 0 && pw !== confirm()) return 'Passwords do not match'
    return null
  })

  const resetMut = useMutation(() => ({
    mutationKey: mutationKeys.passwordResetConfirm,
    mutationFn: async () => confirmPasswordReset(token(), newPassword()),
    onSuccess: () => {
      navigate('/login?resetSuccess=1', { replace: true })
    },
  }))

  const isDisabled = () => resetMut.isPending || !token() || passwordError() !== null
  const errorDescription = createMemo(() => {
    if (!resetMut.isError || !resetMut.error) return ''
    return extractApiErrorMessage(resetMut.error)
  })

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <Card class="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle class="text-xl">Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <Show when={!token()}>
            <Alert variant="destructive" class="mb-4" data-testid="reset-password-missing-token">
              <AlertTitle>Missing reset token</AlertTitle>
              <AlertDescription>
                This page needs a <code>?token=</code> parameter. Request a new link from{' '}
                <A href="/forgot-password" class="underline">
                  Forgot password
                </A>
                .
              </AlertDescription>
            </Alert>
          </Show>

          <Show when={resetMut.isError}>
            <Alert variant="destructive" class="mb-4" data-testid="reset-password-error">
              <AlertTitle>Reset failed</AlertTitle>
              <AlertDescription>{errorDescription()}</AlertDescription>
            </Alert>
          </Show>

          <Show when={token()}>
            <form
              class="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                setShowValidation(true)
                if (!isDisabled()) resetMut.mutate()
              }}
            >
              <div class="flex flex-col gap-2">
                <Label for="reset-new-password">New password</Label>
                <Input
                  id="reset-new-password"
                  type="password"
                  autocomplete="new-password"
                  value={newPassword()}
                  onInput={(e) => setNewPassword(e.currentTarget.value)}
                  data-testid="reset-password-new-input"
                />
              </div>
              <div class="flex flex-col gap-2">
                <Label for="reset-confirm-password">Confirm new password</Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  autocomplete="new-password"
                  value={confirm()}
                  onInput={(e) => setConfirm(e.currentTarget.value)}
                  data-testid="reset-password-confirm-input"
                />
              </div>

              <Show when={showValidation() && passwordError()}>
                <p class="text-destructive text-sm" data-testid="reset-password-validation">
                  {passwordError()}
                </p>
              </Show>

              <Button type="submit" disabled={isDisabled()} data-testid="reset-password-submit">
                {resetMut.isPending ? 'Updating…' : 'Update password'}
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
