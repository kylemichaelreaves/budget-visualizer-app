import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { confirmPasswordReset } from '@api/auth/confirmPasswordReset'
import { Button } from '@components/ui/button'
import { Lock, AlertCircle, CheckCircle2, ShieldCheck, Check, Loader2 } from 'lucide-solid'
import { AuthPageLayout } from './AuthPageLayout'
import { AuthIconHeading } from './AuthIconHeading'
import { AuthDivider } from './AuthDivider'
import { BackToLoginLink } from './BackToLoginLink'
import { PasswordField } from './PasswordField'
import { analyzePassword, REQUIREMENTS, SEG_COLORS, LABEL_COLORS, type Strength } from './passwordStrength'

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
  const showReqs = () => focusedField() === 'password' || password().length > 0

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

              {/* New password field */}
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

                {/* Strength bar */}
                <Show when={strength().level !== 'none' && !pwError()}>
                  <StrengthBar strength={strength()} />
                </Show>

                {/* Requirements grid */}
                <Show when={showReqs()}>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <For each={REQUIREMENTS}>
                      {(req) => (
                        <span
                          class="flex items-center gap-1.5 transition-colors duration-200 text-xs"
                          classList={{
                            'text-emerald-600 dark:text-emerald-400': strength().checks[req.key],
                            'text-muted-foreground/70': !strength().checks[req.key],
                          }}
                        >
                          <span
                            class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-200"
                            classList={{
                              'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400':
                                strength().checks[req.key],
                              'border-muted-foreground/30': !strength().checks[req.key],
                            }}
                          >
                            <Show when={strength().checks[req.key]}>
                              <Check class="h-2 w-2 text-white dark:text-black" stroke-width={3} />
                            </Show>
                          </span>
                          {req.label}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Confirm password field */}
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
          {/* Success: Password updated */}
          <div class="flex flex-col items-center text-center gap-5 px-1">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
              <ShieldCheck class="h-8 w-8 text-emerald-500" />
            </div>

            <div class="flex flex-col gap-2">
              <h2 class="text-foreground text-xl font-semibold">Password updated!</h2>
              <p class="text-muted-foreground leading-relaxed max-w-xs mx-auto text-[15px]">
                Your password has been changed successfully. You can now sign in with your new credentials.
              </p>
            </div>

            <div class="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left w-full">
              <p class="text-muted-foreground text-[13px]">
                <span class="font-medium text-foreground">Security tip:</span> Don't reuse this password on
                other sites. Consider using a password manager.
              </p>
            </div>

            <Button
              onClick={() => navigate('/login?resetSuccess=1', { replace: true })}
              class="w-full rounded-xl py-3 text-[15px] font-semibold"
            >
              Go to login
            </Button>
          </div>
        </Show>
      </Show>
    </AuthPageLayout>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MissingToken() {
  return (
    <div class="flex flex-col items-center text-center gap-5 px-1">
      <AuthIconHeading
        icon={AlertCircle}
        title="Missing reset token"
        hasError
        description={
          <>
            This page needs a <code class="text-foreground">?token=</code> parameter. Request a new link from{' '}
            <A href="/password/reset" class="text-primary underline underline-offset-2">
              Forgot password
            </A>
            .
          </>
        }
      />
    </div>
  )
}

function StrengthBar(props: { strength: Strength }) {
  return (
    <div class="flex flex-col gap-1.5">
      <div
        class="flex gap-1.5"
        role="meter"
        aria-label={`Password strength: ${props.strength.label}`}
        aria-valuenow={props.strength.score}
        aria-valuemin={0}
        aria-valuemax={3}
      >
        <For each={[1, 2, 3] as const}>
          {(s) => (
            <div
              class="h-1.5 flex-1 rounded-full transition-colors duration-300"
              classList={{
                [SEG_COLORS[props.strength.level]]: s <= props.strength.score,
                'bg-muted': s > props.strength.score,
              }}
            />
          )}
        </For>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground/70 text-xs">Strength</span>
        <span
          class={`text-xs font-medium transition-colors duration-300 ${LABEL_COLORS[props.strength.level]}`}
        >
          {props.strength.label}
        </span>
      </div>
    </div>
  )
}
