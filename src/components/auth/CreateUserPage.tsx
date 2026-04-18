import { Show } from 'solid-js'
import { Button } from '@components/ui/button'
import { User as UserIcon, UserPlus, Loader2 } from 'lucide-solid'
import { CenteredCardLayout } from '@components/shared/CenteredCardLayout'
import { IconHeading } from '@components/shared/IconHeading'
import { Divider } from '@components/shared/Divider'
import { ErrorCallout } from '@components/shared/ErrorCallout'
import { EmailField } from './EmailField'
import { AuthTextField } from './AuthTextField'
import { NewPasswordWithStrength } from './NewPasswordWithStrength'
import { ConfirmPasswordWithMatch } from './ConfirmPasswordWithMatch'
import { SignInInsteadFooter } from './SignInInsteadFooter'
import { useCreateUserRegistration } from './useCreateUserRegistration'

export default function CreateUserPage() {
  const r = useCreateUserRegistration()

  return (
    <CenteredCardLayout>
      <form onSubmit={r.handleSubmit} novalidate class="flex flex-col gap-6">
        <IconHeading
          icon={UserPlus}
          title="Create your account"
          description="Enter your details and a strong password to get started."
          hasError={r.hasAnyError()}
        />

        <Show when={r.createMut.isError}>
          <ErrorCallout
            title="Could not create account"
            description={r.apiError()}
            data-testid="register-error"
          />
        </Show>

        <AuthTextField
          id="cu-username"
          label="Username"
          placeholder="Choose a username"
          value={r.username()}
          onInput={(v) => {
            r.setUsername(v)
            r.clearApiErrorOnInput()
          }}
          onFocus={() => r.setFocusedField('username')}
          onBlur={() => r.setFocusedField(null)}
          disabled={r.createMut.isPending}
          focused={r.focusedField() === 'username'}
          hasError={!!r.usernameError()}
          errorMessage={r.usernameError()}
          icon={UserIcon}
          autocomplete="username"
          testid="register-username-input"
        />

        <EmailField
          id="cu-email"
          label="Email"
          helperText="We'll use this for sign-in and account notices."
          errorTestId="register-email-error"
          value={r.email()}
          onInput={(v) => {
            r.setEmail(v)
            r.clearApiErrorOnInput()
          }}
          onFocus={() => r.setFocusedField('email')}
          onBlur={() => r.setFocusedField(null)}
          disabled={r.createMut.isPending}
          focused={r.focusedField() === 'email'}
          hasError={!!r.emailError()}
          errorMessage={r.emailError()}
          testid="register-email-input"
        />

        <NewPasswordWithStrength
          id="cu-password"
          label="Password"
          placeholder="Create a strong password"
          value={r.password()}
          onInput={(v) => {
            r.setPassword(v)
            r.clearApiErrorOnInput()
          }}
          onFocus={() => r.setFocusedField('password')}
          onBlur={() => r.setFocusedField(null)}
          show={r.showPw()}
          onToggleShow={() => r.setShowPw((p) => !p)}
          error={r.pwError()}
          focused={r.focusedField() === 'password'}
          disabled={r.createMut.isPending}
          testid="register-password-input"
          strength={r.strength()}
          showRequirements={r.focusedField() === 'password' || r.password().length > 0}
        />

        <ConfirmPasswordWithMatch
          id="cu-confirm"
          label="Confirm password"
          placeholder="Re-enter your password"
          value={r.confirm()}
          onInput={(v) => {
            r.setConfirm(v)
            r.clearApiErrorOnInput()
          }}
          onFocus={() => r.setFocusedField('confirm')}
          onBlur={() => r.setFocusedField(null)}
          show={r.showCf()}
          onToggleShow={() => r.setShowCf((p) => !p)}
          error={r.cfError()}
          success={r.cfSuccess()}
          focused={r.focusedField() === 'confirm'}
          disabled={r.createMut.isPending}
          testid="register-confirm-input"
          showMatchSuccess={r.cfSuccess() && !r.cfError()}
        />

        <Button
          type="submit"
          disabled={r.isDisabled()}
          class="w-full rounded-xl py-3 text-[15px] font-semibold"
          data-testid="register-submit"
        >
          <Show when={r.createMut.isPending} fallback="Create account">
            <Loader2 class="h-4 w-4 animate-spin" />
            Creating account…
          </Show>
        </Button>

        <Divider />

        <SignInInsteadFooter href={r.signInHref()} />
      </form>
    </CenteredCardLayout>
  )
}
