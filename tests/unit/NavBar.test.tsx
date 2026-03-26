import { render, screen, fireEvent } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { describe, expect, it, beforeEach } from 'vitest'
import { setAuthState } from '@stores/authStore'
import NavBar from '@components/layout/NavBar'

function renderNavBar() {
  return render(() => (
    <MemoryRouter root={() => <NavBar />}>
      <Route path="*" component={() => null} />
    </MemoryRouter>
  ))
}

describe('NavBar', () => {
  beforeEach(() => {
    setAuthState('isUserAuthenticated', false)
    setAuthState('user', {
      id: 0,
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: 'guest',
    })
  })

  it('renders the brand link', () => {
    renderNavBar()
    expect(screen.getByRole('link', { name: 'Budget Visualizer' })).toBeInTheDocument()
  })

  it('shows "Log in" button when unauthenticated', () => {
    renderNavBar()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows "User menu" button with username when authenticated', () => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'username', 'testuser')
    renderNavBar()
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('shows admin badge for admin users', () => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'username', 'adminuser')
    setAuthState('user', 'role', 'admin')
    renderNavBar()
    expect(screen.getByText('admin', { exact: true })).toBeInTheDocument()
  })

  it('does not show admin badge for non-admin users', () => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'username', 'regularuser')
    setAuthState('user', 'role', 'user')
    renderNavBar()
    expect(screen.queryByText('admin', { exact: true })).not.toBeInTheDocument()
  })

  it('clicking login button clears auth state when authenticated', () => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'username', 'testuser')
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('user', '{}')
    renderNavBar()
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
