import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { confirmPasswordReset } from '@api/auth/confirmPasswordReset'
import { Button } from '@components/ui/button'
import { Lock, ShieldCheck, Loader2 } from 'lucide-solid'
import { MissingToken } from './MissingToken'
import { CenteredCardLayout } from '@components/shared/CenteredCardLayout'
import { IconHeading } from '@components/shared/IconHeading'
import { Divider } from '@components/shared/Divider'
import { BackToLoginLink } from './BackToLoginLink'
import { SuccessScreen } from '@components/shared/SuccessScreen'
import { NewPasswordWithStrength } from './NewPasswordWithStrength'
import { ConfirmPasswordWithMatch } from './ConfirmPasswordWithMatch'
import { ErrorCallout } from '@components/shared/ErrorCallout'
import { createNewPasswordFields } from './createNewPasswordFields'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [focusedField, setFocusedField] = createSignal<'password' | 'confirm' | null>(null)
  const [submitted, setSubmitted] = createSignal(false)
  const { password, setPassword, confirm, setConfirm, pwError, cfError, cfSuccess, ...pw } =
    createNewPasswordFields(submitted)

  const token = createMemo(() => {
    const t = searchParams.token
    return typeof t === 'string' ? t : ''
  })

  const hasAnyError = () => !!pwError() || !!cfError() || resetMut.isError

  const resetMut = useMutation(() => ({
    mutationKey: mutationKeys.passwordResetConfirm,
    mutationFn: async () => confirmPasswordReset(token(), password()),
  }))

  const apiError = createMemo(() => {
    if (!resetMut.isError || !resetMut.error) return ''
    return extractApiErrorMessage(resetMut.error)
  })

  const isDisabled = () => resetMut.isPending || !token()

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!pw.isValid()) return
    resetMut.mutate()
  }

  return (
    <CenteredCardLayout>
      <Show when={token()} fallback={<MissingToken />}>
        <Show
          when={resetMut.isSuccess}
          fallback={
            <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-6">
              <IconHeading
                icon={Lock}
                title="Reset your password"
                description="Choose a strong new password for your account."
                hasError={hasAnyError()}
              />

              <Show when={resetMut.isError}>
                <ErrorCallout
                  title="Reset failed"
                  description={apiError()}
                  data-testid="reset-password-error"
                />
              </Show>

              <NewPasswordWithStrength
                id="rp-new"
                label="New password"
                placeholder="Create a strong password"
                value={password()}
                onInput={(v) => {
                  setPassword(v)
                  if (resetMut.isError) resetMut.reset()
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                show={pw.showPw()}
                onToggleShow={pw.toggleShowPw}
                error={pwError()}
                focused={focusedField() === 'password'}
                disabled={resetMut.isPending}
                testid="reset-password-new-input"
                strength={pw.strength()}
                showRequirements={focusedField() === 'password' || password().length > 0}
              />

              <ConfirmPasswordWithMatch
                id="rp-confirm"
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirm()}
                onInput={setConfirm}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                show={pw.showCf()}
                onToggleShow={pw.toggleShowCf}
                error={cfError()}
                success={cfSuccess()}
                focused={focusedField() === 'confirm'}
                disabled={resetMut.isPending}
                testid="reset-password-confirm-input"
                showMatchSuccess={cfSuccess() && !cfError()}
              />

              <Show when={confirm().length > 0 && password() !== confirm() && submitted()}>
                <ErrorCallout
                  title="Password mismatch"
                  description="Make sure both fields contain the exact same password."
                />
              </Show>

              <Button
                type="submit"
                disabled={isDisabled()}
                class="w-full rounded-xl py-3 text-[15px] font-semibold"
                data-testid="reset-password-submit"
              >
                <Show when={resetMut.isPending} fallback="Reset password">
                  <Loader2 class="h-4 w-4 animate-spin" />
                  Updating password…
                </Show>
              </Button>

              <Divider />
              <BackToLoginLink />
            </form>
          }
        >
          <SuccessScreen
            icon={ShieldCheck}
            title="Password updated!"
            description="Your password has been changed successfully. You can now sign in with your new credentials."
            tip={{
              label: 'Security tip:',
              text: "Don't reuse this password on other sites. Consider using a password manager.",
            }}
          >
            <Button
              onClick={() => navigate('/login?resetSuccess=1', { replace: true })}
              class="w-full rounded-xl py-3 text-[15px] font-semibold"
            >
              Go to login
            </Button>
          </SuccessScreen>
        </Show>
      </Show>
    </CenteredCardLayout>
  )
}
