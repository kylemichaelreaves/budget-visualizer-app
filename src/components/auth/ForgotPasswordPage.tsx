import { useNavigate } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { requestPasswordReset } from '@api/auth/requestPasswordReset'
import { isValidEmail } from '@utils/validateEmail'
import { Button } from '@components/ui/button'
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-solid'
import { AuthPageLayout } from './AuthPageLayout'
import { AuthIconHeading } from './AuthIconHeading'
import { AuthDivider } from './AuthDivider'
import { BackToLoginLink } from './BackToLoginLink'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = createSignal('')
  const [focused, setFocused] = createSignal(false)
  const [touched, setTouched] = createSignal(false)

  const resetMut = useMutation(() => ({
    mutationKey: mutationKeys.passwordResetRequest,
    mutationFn: async () => requestPasswordReset(email().trim()),
  }))

  const emailInvalid = createMemo(() => touched() && email().trim().length > 0 && !isValidEmail(email()))
  const hasError = () => emailInvalid() || resetMut.isError
  const isDisabled = () => resetMut.isPending || !isValidEmail(email())

  const apiError = createMemo(() => {
    if (!resetMut.isError || !resetMut.error) return ''
    return extractApiErrorMessage(resetMut.error)
  })

  const errorMsg = createMemo(() => {
    if (resetMut.isError) return apiError()
    if (emailInvalid()) return 'Please enter a valid email address (e.g. name@example.com).'
    return null
  })

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isDisabled()) resetMut.mutate()
  }

  function handleTryAgain() {
    setEmail('')
    setTouched(false)
    resetMut.reset()
  }

  return (
    <AuthPageLayout>
      <Show
        when={resetMut.isSuccess}
        fallback={
          <form onSubmit={handleSubmit} novalidate class="flex flex-col gap-6">
            <AuthIconHeading
              icon={Lock}
              title="Forgot your password?"
              description={<>No&nbsp;worries — enter your email and we'll send you a&nbsp;reset&nbsp;link.</>}
              hasError={hasError()}
            />

            {/* Email field */}
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label for="fp-email" class="text-foreground text-sm font-medium">
                  Email address
                  <span class="ml-1 text-destructive" aria-hidden="true">
                    *
                  </span>
                </label>
                <Show when={!hasError()}>
                  <span class="text-muted-foreground/70 text-xs">Required</span>
                </Show>
              </div>

              <div class="relative">
                <Mail
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200"
                  classList={{
                    'text-destructive': hasError(),
                    'text-primary': focused() && !hasError(),
                    'text-muted-foreground': !focused() && !hasError(),
                  }}
                />
                <input
                  id="fp-email"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  value={email()}
                  onInput={(e) => {
                    setEmail(e.currentTarget.value)
                    if (touched()) setTouched(false)
                    if (resetMut.isError) resetMut.reset()
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false)
                    setTouched(true)
                  }}
                  disabled={resetMut.isPending}
                  aria-invalid={hasError()}
                  aria-describedby={hasError() ? 'fp-error' : 'fp-helper'}
                  data-testid="forgot-password-email-input"
                  class="w-full rounded-xl border bg-input-background px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  classList={{
                    'border-destructive ring-2 ring-destructive/20': hasError(),
                    'border-primary ring-2 ring-primary/20': focused() && !hasError(),
                    'border-border hover:border-primary/40': !focused() && !hasError(),
                  }}
                />
                <Show when={hasError()}>
                  <AlertCircle class="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
                </Show>
              </div>

              <div class="min-h-[18px]">
                <Show
                  when={hasError()}
                  fallback={
                    <p id="fp-helper" class="text-muted-foreground text-[13px]">
                      We'll send a secure reset link to this address.
                    </p>
                  }
                >
                  <p
                    id="fp-error"
                    role="alert"
                    class="flex items-start gap-1.5 text-destructive text-[13px]"
                    data-testid="forgot-password-error"
                  >
                    <AlertCircle class="h-3.5 w-3.5 mt-px shrink-0" />
                    {errorMsg()}
                  </p>
                </Show>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isDisabled()}
              class="w-full rounded-xl py-3 text-[15px] font-semibold"
              data-testid="forgot-password-submit"
            >
              <Show when={resetMut.isPending} fallback="Send reset link">
                <Loader2 class="h-4 w-4 animate-spin" />
                Sending…
              </Show>
            </Button>

            <AuthDivider />
            <BackToLoginLink />
          </form>
        }
      >
        {/* Success: Check your inbox */}
        <div class="flex flex-col items-center text-center gap-5 px-1">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 class="h-8 w-8 text-emerald-500" />
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="text-foreground text-xl font-semibold" data-testid="forgot-password-success">
              Check your inbox
            </h2>
            <p class="text-muted-foreground leading-relaxed max-w-xs mx-auto text-[15px]">
              We sent a password reset link to{' '}
              <span class="font-medium text-foreground break-all">{email()}</span>. It expires
              in&nbsp;15&nbsp;minutes.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left w-full">
            <p class="text-muted-foreground text-[13px]">
              <span class="font-medium text-foreground">Didn't receive it?</span> Check your spam folder or
              wait a moment before requesting another link.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTryAgain}
            class="text-primary hover:opacity-70 transition-opacity text-sm"
          >
            Try a different email address
          </button>

          <div class="flex flex-col items-center gap-4 w-full">
            <div class="w-full border-t border-border" />
            <button
              type="button"
              onClick={() => navigate('/login')}
              class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft class="h-3.5 w-3.5" />
              Back to login
            </button>
          </div>
        </div>
      </Show>
    </AuthPageLayout>
  )
}
