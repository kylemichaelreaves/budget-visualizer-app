import { flush } from 'solid-js'
import { render, screen } from '@solidjs/testing-library'
import MemoryRouterShell from '@mocks/MemoryRouterShell'
import { describe, expect, it, beforeEach } from 'vitest'
import { setAuthState } from '@stores/authStore'
import NavBar from '@components/layout/NavBar'

function renderNavBar() {
  return render(() => (
    <MemoryRouterShell>
      <NavBar />
    </MemoryRouterShell>
  ))
}

describe('NavBar', () => {
  beforeEach(() => {
    setAuthState((s) => {
      s.isUserAuthenticated = false
    })
    flush()
    setAuthState((s) => {
      s.user = {
        id: 0,
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        role: 'guest',
      }
    })
    flush()
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
    setAuthState((s) => {
      s.isUserAuthenticated = true
    })
    flush()
    setAuthState((s) => {
      s.user.username = 'testuser'
    })
    flush()
    renderNavBar()
    const trigger = screen.getByTestId('navbar-user-menu-trigger')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAccessibleName(/account menu for testuser/i)
  })

  it('shows admin badge for admin users', () => {
    setAuthState((s) => {
      s.isUserAuthenticated = true
    })
    flush()
    setAuthState((s) => {
      s.user.username = 'adminuser'
    })
    flush()
    setAuthState((s) => {
      s.user.role = 'admin'
    })
    flush()
    renderNavBar()
    expect(screen.getByText('admin', { exact: true })).toBeInTheDocument()
  })

  it('does not show admin badge for non-admin users', () => {
    setAuthState((s) => {
      s.isUserAuthenticated = true
    })
    flush()
    setAuthState((s) => {
      s.user.username = 'regularuser'
    })
    flush()
    setAuthState((s) => {
      s.user.role = 'user'
    })
    flush()
    renderNavBar()
    expect(screen.queryByText('admin', { exact: true })).not.toBeInTheDocument()
  })

  // Full open-menu + item click is better covered in Playwright; Kobalte + JSDOM often
  // do not mount the portaled menu on `fireEvent.click` the way a real browser does.
})
