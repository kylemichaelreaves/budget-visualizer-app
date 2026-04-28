import type { User } from '@types'

/** Two-letter initials for avatar chips (first + last name, else start of username). */
export function userDisplayInitials(user: Pick<User, 'firstName' | 'lastName' | 'username'>): string {
  const first = user.firstName?.trim()
  const last = user.lastName?.trim()
  if (first && last) return `${first[0]!}${last[0]!}`.toUpperCase()
  if (first && first.length >= 2) return first.slice(0, 2).toUpperCase()
  const u = user.username?.trim()
  if (u && u.length >= 2) return u.slice(0, 2).toUpperCase()
  if (u) return u.slice(0, 1).toUpperCase()
  return '?'
}
