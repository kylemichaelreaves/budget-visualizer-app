import { describe, expect, it } from 'vitest'
import { userDisplayInitials } from '@utils/userInitials'

describe('userDisplayInitials', () => {
  it('uses first and last initial when both present', () => {
    expect(userDisplayInitials({ firstName: 'Alex', lastName: 'Chen', username: 'ac' })).toBe('AC')
  })

  it('uses username when no names', () => {
    expect(userDisplayInitials({ firstName: '', lastName: '', username: 'jane' })).toBe('JA')
  })
})
