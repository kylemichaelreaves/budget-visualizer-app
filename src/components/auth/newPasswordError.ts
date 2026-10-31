import { analyzePassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './passwordStrength'

/**
 * Client-side gate for a new password (registration, reset, change). Length is
 * a hard requirement mirroring resourceQuerier's `validateRequest`, checked
 * before strength so a short password is never reported as merely "weak".
 * Returns `null` when the password is acceptable.
 */
export function newPasswordError(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (pw.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`
  if (analyzePassword(pw).score < 2)
    return 'Password is too weak — add at least two of: an uppercase letter, a number, a symbol.'
  return null
}
