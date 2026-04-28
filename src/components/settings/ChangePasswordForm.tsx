import { A, useNavigate } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { changePassword } from '@api/auth/changePassword'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { mutationKeys } from '@api/queryKeys'
import { PasswordField } from '@components/auth/PasswordField'
import { NewPasswordWithStrength } from '@components/auth/NewPasswordWithStrength'
import { ConfirmPasswordWithMatch } from '@components/auth/ConfirmPasswordWithMatch'
import { analyzePassword } from '@components/auth/passwordStrength'
import { ErrorCallout } from '@components/shared/ErrorCallout'
import { Button } from '@components/ui/button'
import { Loader2, ShieldCheck } from 'lucide-solid'

type FocusField = 'current' | 'new' | 'confirm' | null

export function ChangePasswordForm() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [showCurrent, setShowCurrent] = createSignal(false)
  const [showNew, setShowNew] = createSignal(false)
  const [showConfirm, setShowConfirm] = createSignal(false)
  const [focusedField, setFocusedField] = createSignal<FocusField>(null)
  const [submitted, setSubmitted] = createSignal(false)

  const strength = createMemo(() => analyzePassword(newPassword()))

  const newPwError = createMemo(() => {
    if (!submitted()) return null
    if (strength().score < 2)
      return 'Password is too weak \u2014 meet at least 3 of the 4 requirements below.'
    return null
  })

  const confirmError = createMemo(() => {
    if (!submitted()) return null
    if (!confirm()) return 'Please confirm your password.'
    if (newPassword() !== confirm()) return 'Passwords don\u2019t match. Please try again.'
    return null
  })

  const currentError = createMemo(() => {
    if (!submitted()) return null
    if (!currentPassword().trim()) return 'Enter your current password.'
    return null
  })

  const confirmSuccess = () => !confirmError() && confirm().length > 0 && confirm() === newPassword()

  const changeMut = useMutation(() => ({
    mutationKey: mutationKeys.passwordChange,
    mutationFn: async () => changePassword(currentPassword(), newPassword()),
  }))

  const apiError = createMemo(() => {
    if (!changeMut.isError || !changeMut.error) return ''
    return extractApiErrorMessage(changeMut.error)
  })

  const isDisabled = () => changeMut.isPending

  function resetFormAfterSuccess() {
    changeMut.reset()
    setCurrentPassword('')
    setNewPassword('')
    setConfirm('')
    setSubmitted(false)
    setFocusedField(null)
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!currentPassword().trim() || strength().score < 2 || newPassword() !== confirm() || !confirm()) {
      return
    }
    changeMut.mutate()
  }

  return (
    <Show
      when={changeMut.isSuccess}
      fallback={
        <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-5">
          <Show when={changeMut.isError}>
            <ErrorCallout
              title="Could not update password"
              description={apiError()}
              data-testid="change-password-error"
            />
          </Show>

          <div class="flex flex-col gap-1.5">
            <PasswordField
              id="change-pw-current"
              label="Current password"
              placeholder="Enter your current password"
              value={currentPassword()}
              onInput={(v) => {
                setCurrentPassword(v)
                if (changeMut.isError) changeMut.reset()
              }}
              onFocus={() => setFocusedField('current')}
              onBlur={() => setFocusedField(null)}
              show={showCurrent()}
              onToggleShow={() => setShowCurrent((p) => !p)}
              error={currentError()}
              focused={focusedField() === 'current'}
              disabled={changeMut.isPending}
              testid="change-password-current-input"
              autocomplete="current-password"
            />
            <A
              href="/password/reset"
              class="self-start text-primary text-xs underline underline-offset-2 hover:opacity-90"
              data-testid="change-password-forgot-link"
            >
              Forgot your password?
            </A>
          </div>

          <div class="-mx-6 border-t border-border" />

          <NewPasswordWithStrength
            id="change-pw-new"
            label="New password"
            placeholder="Create a new password"
            value={newPassword()}
            onInput={(v) => {
              setNewPassword(v)
              if (changeMut.isError) changeMut.reset()
            }}
            onFocus={() => setFocusedField('new')}
            onBlur={() => setFocusedField(null)}
            show={showNew()}
            onToggleShow={() => setShowNew((p) => !p)}
            error={newPwError()}
            focused={focusedField() === 'new'}
            disabled={changeMut.isPending}
            testid="change-password-new-input"
            strength={strength()}
            showRequirements={focusedField() === 'new' || newPassword().length > 0}
          />

          <ConfirmPasswordWithMatch
            id="change-pw-confirm"
            label="Confirm new password"
            placeholder="Re-enter your new password"
            value={confirm()}
            onInput={setConfirm}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            show={showConfirm()}
            onToggleShow={() => setShowConfirm((p) => !p)}
            error={confirmError()}
            success={confirmSuccess()}
            focused={focusedField() === 'confirm'}
            disabled={changeMut.isPending}
            testid="change-password-confirm-input"
            showMatchSuccess={confirmSuccess() && !confirmError()}
          />

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 pt-1">
            <Button
              type="submit"
              disabled={isDisabled()}
              class="rounded-xl px-6 py-2.5 text-[15px] font-semibold w-full sm:w-auto"
              data-testid="change-password-submit"
            >
              <Show when={changeMut.isPending} fallback="Update password">
                <Loader2 class="h-4 w-4 animate-spin" />
                Updating…
              </Show>
            </Button>
            <Show when={changeMut.isPending}>
              <p class="text-muted-foreground text-xs">Verifying…</p>
            </Show>
          </div>
        </form>
      }
    >
      <div class="flex flex-col items-center gap-4 py-6 text-center px-1">
        <div class="h-14 w-14 rounded-full bg-success-muted flex items-center justify-center">
          <ShieldCheck class="h-7 w-7 text-success" />
        </div>
        <div>
          <p class="text-foreground text-[15px] font-semibold">Password updated</p>
          <p class="text-muted-foreground mt-1 text-sm">
            Your password has been changed successfully. You&apos;ll use it next time you sign in.
          </p>
        </div>
        <button
          type="button"
          class="text-primary text-sm underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
          onClick={() => resetFormAfterSuccess()}
          data-testid="change-password-change-again"
        >
          Change again
        </button>
        <Button
          type="button"
          variant="secondary"
          class="w-full max-w-xs rounded-xl py-3 text-[15px] font-semibold"
          onClick={() => navigate('/budget-visualizer/transactions', { replace: true })}
          data-testid="change-password-done"
        >
          Back to app
        </Button>
      </div>
    </Show>
  )
}
