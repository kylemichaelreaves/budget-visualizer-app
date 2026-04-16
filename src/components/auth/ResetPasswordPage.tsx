import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { confirmPasswordReset } from '@api/auth/confirmPasswordReset'
import { Button } from '@components/ui/button'
import { Card, CardContent } from '@components/ui/card'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-solid'

// ── Password strength analysis ──────────────────────────────────────────────

type StrengthLevel = 'none' | 'weak' | 'fair' | 'strong'

interface Strength {
  score: 0 | 1 | 2 | 3
  level: StrengthLevel
  label: string
  checks: {
    length: boolean
    upper: boolean
    number: boolean
    symbol: boolean
  }
}

function analyzePassword(pw: string): Strength {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
  if (!pw) return { score: 0, level: 'none', label: '', checks }
  const n = Object.values(checks).filter(Boolean).length
  if (n <= 2) return { score: 1, level: 'weak', label: 'Weak', checks }
  if (n <= 3) return { score: 2, level: 'fair', label: 'Fair', checks }
  return { score: 3, level: 'strong', label: 'Strong', checks }
}

const REQUIREMENTS: { key: keyof Strength['checks']; label: string }[] = [
  { key: 'length', label: '8+ characters' },
  { key: 'upper', label: 'Uppercase (A\u2013Z)' },
  { key: 'number', label: 'Number (0\u20139)' },
  { key: 'symbol', label: 'Symbol (!@#\u2026)' },
]

const SEG_COLORS: Record<StrengthLevel, string> = {
  weak: 'bg-destructive',
  fair: 'bg-amber-500',
  strong: 'bg-emerald-500',
  none: '',
}

const LABEL_COLORS: Record<StrengthLevel, string> = {
  weak: 'text-destructive',
  fair: 'text-amber-600 dark:text-amber-400',
  strong: 'text-emerald-600 dark:text-emerald-400',
  none: '',
}

// ── Component ───────────────────────────────────────────────────────────────

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

  // Validation errors (shown after submit attempt)
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
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <Card class="w-full max-w-[420px]">
        <CardContent class="p-6">
          {/* Missing token */}
          <Show when={token()} fallback={<MissingToken />}>
            <Show
              when={resetMut.isSuccess}
              fallback={
                <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-6">
                  {/* Icon + heading */}
                  <div class="flex flex-col items-center text-center gap-4">
                    <div
                      class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300"
                      classList={{
                        'bg-destructive/10 dark:bg-destructive/20': hasAnyError(),
                        'bg-primary/8 dark:bg-primary/15': !hasAnyError(),
                      }}
                    >
                      <Lock
                        class="h-6 w-6 transition-colors duration-300"
                        classList={{
                          'text-destructive': hasAnyError(),
                          'text-primary': !hasAnyError(),
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <h2 class="text-foreground text-xl font-semibold">Reset your password</h2>
                      <p class="text-muted-foreground leading-relaxed text-[15px]">
                        Choose a strong new password for your account.
                      </p>
                    </div>
                  </div>

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
                      <div class="flex flex-col gap-1.5">
                        <div
                          class="flex gap-1.5"
                          role="meter"
                          aria-label={`Password strength: ${strength().label}`}
                          aria-valuenow={strength().score}
                          aria-valuemin={0}
                          aria-valuemax={3}
                        >
                          <For each={[1, 2, 3] as const}>
                            {(s) => (
                              <div
                                class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                                classList={{
                                  [SEG_COLORS[strength().level]]: s <= strength().score,
                                  'bg-muted': s > strength().score,
                                }}
                              />
                            )}
                          </For>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-muted-foreground/70 text-xs">Strength</span>
                          <span
                            class={`text-xs font-medium transition-colors duration-300 ${LABEL_COLORS[strength().level]}`}
                          >
                            {strength().label}
                          </span>
                        </div>
                      </div>
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

                    {/* Match success */}
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

                  {/* Submit */}
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

                  {/* Divider */}
                  <div class="flex items-center gap-3 text-muted-foreground/50 text-xs">
                    <div class="flex-1 border-t border-border" />
                    or
                    <div class="flex-1 border-t border-border" />
                  </div>

                  {/* Back to login */}
                  <div class="flex justify-center">
                    <A
                      href="/login"
                      class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      <ArrowLeft class="h-3.5 w-3.5" />
                      Back to login
                    </A>
                  </div>
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
                    Your password has been changed successfully. You can now sign in with your new
                    credentials.
                  </p>
                </div>

                <div class="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left w-full">
                  <p class="text-muted-foreground text-[13px]">
                    <span class="font-medium text-foreground">Security tip:</span> Don't reuse this password
                    on other sites. Consider using a password manager.
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
        </CardContent>
      </Card>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MissingToken() {
  return (
    <div class="flex flex-col items-center text-center gap-5 px-1">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 dark:bg-destructive/20">
        <AlertCircle class="h-6 w-6 text-destructive" />
      </div>
      <div class="flex flex-col gap-1.5">
        <h2 class="text-foreground text-xl font-semibold">Missing reset token</h2>
        <p class="text-muted-foreground leading-relaxed text-[15px]">
          This page needs a <code class="text-foreground">?token=</code> parameter. Request a new link from{' '}
          <A href="/password/reset" class="text-primary underline underline-offset-2">
            Forgot password
          </A>
          .
        </p>
      </div>
    </div>
  )
}

function PasswordField(props: {
  id: string
  label: string
  placeholder: string
  value: string
  onInput: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  show: boolean
  onToggleShow: () => void
  error: string | null
  success?: boolean
  focused: boolean
  disabled: boolean
  testid: string
}) {
  const hasError = () => !!props.error
  const iconColor = () =>
    hasError()
      ? 'text-destructive'
      : props.success
        ? 'text-emerald-500'
        : props.focused
          ? 'text-primary'
          : 'text-muted-foreground'

  return (
    <div class="flex flex-col gap-1.5">
      <label for={props.id} class="text-foreground text-sm font-medium">
        {props.label}
        <span class="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      </label>

      <div class="relative">
        <Lock
          class={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200 ${iconColor()}`}
        />
        <input
          id={props.id}
          type={props.show ? 'text' : 'password'}
          autocomplete="new-password"
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          disabled={props.disabled}
          aria-invalid={hasError()}
          data-testid={props.testid}
          class="w-full rounded-xl border bg-input-background px-4 py-3 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          classList={{
            'border-destructive ring-2 ring-destructive/20': hasError(),
            'border-emerald-500 ring-2 ring-emerald-500/20': !hasError() && !!props.success,
            'border-primary ring-2 ring-primary/20': props.focused && !hasError() && !props.success,
            'border-border hover:border-primary/40': !props.focused && !hasError() && !props.success,
          }}
        />

        <Show
          when={!hasError()}
          fallback={
            <AlertCircle class="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
          }
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={props.onToggleShow}
            disabled={props.disabled}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
            aria-label={props.show ? 'Hide password' : 'Show password'}
          >
            <Show when={props.show} fallback={<Eye class="h-4 w-4" />}>
              <EyeOff class="h-4 w-4" />
            </Show>
          </button>
        </Show>
      </div>

      <Show when={hasError()}>
        <p role="alert" class="flex items-start gap-1.5 text-destructive text-[13px]">
          <AlertCircle class="h-3.5 w-3.5 mt-px shrink-0" />
          {props.error}
        </p>
      </Show>
    </div>
  )
}
