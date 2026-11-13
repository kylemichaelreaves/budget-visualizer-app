import type { Accessor } from 'solid-js'
import { createMemo, createSignal } from 'solid-js'
import { analyzePassword } from './passwordStrength'
import { newPasswordError } from './newPasswordError'

export const CONFIRM_REQUIRED_ERROR = 'Please confirm your password.'
export const CONFIRM_MISMATCH_ERROR = 'Passwords don’t match. Please try again.'

/**
 * State and validation for a "new password + confirm" pair, shared by
 * registration, password reset and password change so the three can't drift.
 *
 * Errors stay hidden until `submitted()` is true; `isValid()` is the submit
 * gate and ignores `submitted`, so a handler can set it and check in one go.
 * Password values live only in these local signals, never on `User`.
 */
export function createNewPasswordFields(submitted: Accessor<boolean>) {
  const [password, setPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [showPw, setShowPw] = createSignal(false)
  const [showCf, setShowCf] = createSignal(false)

  const strength = createMemo(() => analyzePassword(password()))

  const confirmError = (): string | null => {
    if (!confirm()) return CONFIRM_REQUIRED_ERROR
    if (password() !== confirm()) return CONFIRM_MISMATCH_ERROR
    return null
  }

  const pwError = createMemo(() => (submitted() ? newPasswordError(password()) : null))
  const cfError = createMemo(() => (submitted() ? confirmError() : null))
  const cfSuccess = () => !cfError() && confirm().length > 0 && confirm() === password()

  const isValid = () => newPasswordError(password()) === null && confirmError() === null

  function reset() {
    setPassword('')
    setConfirm('')
    setShowPw(false)
    setShowCf(false)
  }

  return {
    password,
    setPassword,
    confirm,
    setConfirm,
    showPw,
    toggleShowPw: () => setShowPw((p) => !p),
    showCf,
    toggleShowCf: () => setShowCf((p) => !p),
    strength,
    pwError,
    cfError,
    cfSuccess,
    isValid,
    reset,
  }
}
