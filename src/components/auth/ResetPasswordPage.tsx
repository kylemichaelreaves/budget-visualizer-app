import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { confirmPasswordReset } from '@api/auth/confirmPasswordReset'
import { Button } from '@components/ui/button'
import { Lock, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-solid'
import { MissingToken } from './MissingToken'
import { AuthPageLayout } from './AuthPageLayout'
import { AuthIconHeading } from './AuthIconHeading'
import { AuthDivider } from './AuthDivider'
import { BackToLoginLink } from './BackToLoginLink'
import { AuthSuccessScreen } from './AuthSuccessScreen'
import { PasswordField } from './PasswordField'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { analyzePassword } from './passwordStrength'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [password, setPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [showPw, setShowPw] = createSignal(false)
  const [showCf, setShowCf] = createSignal(false)
  const [focusedField, setFocusedField] = createSignal<'password' | 'confirm' | null>(null)
  const [submitted, setSubmitted] = createSignal(false)

  const token = createMemo(() => {
    const t = searchParams.token
    return typeof t === 'string' ? t : ''
  })

  const strength = createMemo(() => analyzePassword(password()))

  const pwError = createMemo(() => {
    if (!submitted()) return null
    if (strength().score < 2)
      return 'Password is too weak \u2014 use 8+ characters with uppercase and a number.'
    return null
  })

  const cfError = createMemo(() => {
    if (!submitted()) return null
    if (!confirm()) return 'Please confirm your password.'
    if (password() !== confirm()) return 'Passwords don\u2019t match. Please try again.'
    return null
  })

  const hasAnyError = () => !!pwError() || !!cfError() || resetMut.isError
  const cfSuccess = () => !cfError() && confirm().length > 0 && confirm() === password()

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
    if (strength().score < 2 || password() !== confirm() || !confirm()) return
    resetMut.mutate()
  }

  return (
    <AuthPageLayout>
      <Show when={token()} fallback={<MissingToken />}>
        <Show
          when={resetMut.isSuccess}
          fallback={
            <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-6">
              <AuthIconHeading
                icon={Lock}
                title="Reset your password"
                description="Choose a strong new password for your account."
                hasError={hasAnyError()}
              />

              {/* API error */}
              <Show when={resetMut.isError}>
                <div
                  class="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
                  data-testid="reset-password-error"
                >
                  <AlertCircle class="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div class="flex flex-col gap-0.5">
                    <p class="text-destructive text-[13px] font-medium">Reset failed</p>
                    <p class="text-muted-foreground text-[13px]">{apiError()}</p>
                  </div>
                </div>
              </Show>

              {/* New password */}
              <div class="flex flex-col gap-2">
                <PasswordField
                  id="rp-new"
                  label="New password"
                  placeholder="Create a strong password"
                  value={password()}
                  onInput={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  show={showPw()}
                  onToggleShow={() => setShowPw((p) => !p)}
                  error={pwError()}
                  focused={focusedField() === 'password'}
                  disabled={resetMut.isPending}
                  testid="reset-password-new-input"
                />

                <Show when={!pwError()}>
                  <PasswordStrengthIndicator
                    strength={strength()}
                    showRequirements={focusedField() === 'password' || password().length > 0}
                  />
                </Show>
              </div>

              {/* Confirm password */}
              <div class="flex flex-col gap-1.5">
                <PasswordField
                  id="rp-confirm"
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  value={confirm()}
                  onInput={(v) => {
                    setConfirm(v)
                    if (submitted() && v === password()) setSubmitted(false)
                  }}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  show={showCf()}
                  onToggleShow={() => setShowCf((p) => !p)}
                  error={cfError()}
                  success={cfSuccess()}
                  focused={focusedField() === 'confirm'}
                  disabled={resetMut.isPending}
                  testid="reset-password-confirm-input"
                />

                <Show when={cfSuccess() && !cfError()}>
                  <p class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[13px]">
                    <CheckCircle2 class="h-3.5 w-3.5 shrink-0" />
                    Passwords match
                  </p>
                </Show>
              </div>

              {/* Mismatch callout */}
              <Show when={cfError()}>
                <div class="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <AlertCircle class="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div class="flex flex-col gap-0.5">
                    <p class="text-destructive text-[13px] font-medium">Password mismatch</p>
                    <p class="text-muted-foreground text-[13px]">
                      Make sure both fields contain the exact same password.
                    </p>
                  </div>
                </div>
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

              <AuthDivider />
              <BackToLoginLink />
            </form>
          }
        >
          <AuthSuccessScreen
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
          </AuthSuccessScreen>
        </Show>
      </Show>
    </AuthPageLayout>
  )
}
