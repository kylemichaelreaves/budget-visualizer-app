import type { User } from '@types'

/** Full name when the account has one, otherwise the username. */
export function userDisplayName(user: Pick<User, 'firstName' | 'lastName' | 'username'>): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.username
}
