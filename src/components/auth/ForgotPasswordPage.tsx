import { useNavigate } from '@solidjs/router'
import { createMemo, createSignal, Show } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { requestPasswordReset } from '@api/auth/requestPasswordReset'
import { isValidEmail } from '@utils/validateEmail'
import { Button } from '@components/ui/button'
import { Lock, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-solid'
import { AuthPageLayout } from './AuthPageLayout'
import { AuthIconHeading } from './AuthIconHeading'
import { AuthDivider } from './AuthDivider'
import { BackToLoginLink } from './BackToLoginLink'
import { AuthSuccessScreen } from './AuthSuccessScreen'
import { EmailField } from './EmailField'

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

  const errorMsg = createMemo(() => {
    if (resetMut.isError && resetMut.error) return extractApiErrorMessage(resetMut.error)
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

            <EmailField
              value={email()}
              onInput={(v) => {
                setEmail(v)
                if (touched()) setTouched(false)
                if (resetMut.isError) resetMut.reset()
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false)
                setTouched(true)
              }}
              disabled={resetMut.isPending}
              focused={focused()}
              hasError={hasError()}
              errorMessage={errorMsg()}
              testid="forgot-password-email-input"
            />

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
        <AuthSuccessScreen
          icon={CheckCircle2}
          title="Check your inbox"
          description={
            <>
              We sent a password reset link to{' '}
              <span class="font-medium text-foreground break-all">{email()}</span>. It expires
              in&nbsp;15&nbsp;minutes.
            </>
          }
          tip={{
            label: "Didn't receive it?",
            text: 'Check your spam folder or wait a moment before requesting another link.',
          }}
        >
          <span data-testid="forgot-password-success" />

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
        </AuthSuccessScreen>
      </Show>
    </AuthPageLayout>
  )
}
