import { createStore } from 'solid-js/store'
import { httpClient } from '@api/httpClient'
import type { User } from '@types'

const emptyUser: User = {
  id: 0,
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'guest',
}

export type AuthState = {
  token: string
  user: User
  isUserAuthenticated: boolean
}

export const [authState, setAuthState] = createStore<AuthState>({
  token: '',
  user: { ...emptyUser },
  isUserAuthenticated: false,
})

export function hydrateAuthFromStorage(): void {
  const userRaw = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  if (!userRaw || !token || userRaw === 'undefined') return
  try {
    setAuthState('user', JSON.parse(userRaw) as User)
    setAuthState('token', token)
    setAuthState('isUserAuthenticated', true)
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}

export async function loginRequest(email: string, password: string) {
  const { data } = await httpClient.post<{ message: string; user: User; token: string }>('/login', {
    email,
    password,
  })
  return data
}

export function persistSession(user: User, token: string): void {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', token)
  setAuthState('user', user)
  setAuthState('token', token)
  setAuthState('isUserAuthenticated', true)
}

export function logout(): void {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  setAuthState('token', '')
  setAuthState('isUserAuthenticated', false)
  setAuthState('user', { ...emptyUser })
}
