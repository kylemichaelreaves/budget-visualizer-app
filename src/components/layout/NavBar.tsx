import { Show } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { authState, logout } from '@stores/authStore'
import './NavBar.css'

export default function NavBar() {
  const navigate = useNavigate()

  function handleLoginLogout() {
    if (authState.isUserAuthenticated) {
      logout()
      navigate('/')
    } else {
      navigate('/login')
    }
  }

  return (
    <nav class="navbar" aria-label="Main navigation">
      <A href="/budget-visualizer/transactions" class="navbar-brand">
        Budget Visualizer
      </A>

      <button type="button" class="navbar-login" onClick={handleLoginLogout} aria-label={authState.isUserAuthenticated ? 'User menu' : 'Log in'}>
        <div class={`navbar-avatar ${authState.isUserAuthenticated ? 'navbar-avatar--active' : ''}`} role="img" aria-hidden="true">
          <Show
            when={authState.isUserAuthenticated}
            fallback={
              <svg class="navbar-avatar-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            }
          >
            <svg class="navbar-avatar-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />
            </svg>
          </Show>
        </div>
        <span class="navbar-login-label">
          {authState.isUserAuthenticated ? authState.user.username : 'Log In'}
        </span>
        <Show when={authState.isUserAuthenticated && authState.user.role === 'admin'}>
          <span class="navbar-admin-badge">admin</span>
        </Show>
      </button>
    </nav>
  )
}
