const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Cheap client-side email shape check — same pattern the backend uses
 * (`src/handlers/shared/helpers/validateRequest.ts` in resourceQuerier).
 * The backend is the source of truth; this is just to give immediate form feedback.
 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 254) return false
  return EMAIL_REGEX.test(trimmed)
}
