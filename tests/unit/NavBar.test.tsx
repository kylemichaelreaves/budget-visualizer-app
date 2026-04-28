import { render, screen } from '@solidjs/testing-library'
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

  it('shows account menu trigger when authenticated', () => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'username', 'testuser')
    renderNavBar()
    const trigger = screen.getByTestId('navbar-user-menu-trigger')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAccessibleName(/account menu for testuser/i)
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

  // Full open-menu + item click is better covered in Playwright; Kobalte + JSDOM often
  // do not mount the portaled menu on `fireEvent.click` the way a real browser does.
})
