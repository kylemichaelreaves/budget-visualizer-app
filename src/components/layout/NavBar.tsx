import { Show } from 'solid-js'
import { A } from '@solidjs/router'
import { authState } from '@stores/authStore'
import { UserNavDropdown } from '@components/layout/UserNavDropdown'

/** Total block height of the app chrome bar — keep in sync with `BudgetVisualizer` fill height. */
export const NAVBAR_APP_HEIGHT_PX = 52

export default function NavBar() {
  function goLogin() {
    window.location.assign('/login')
  }

  return (
    <nav
      class="flex items-center justify-between px-5 bg-card border-b-4 border-brand"
      style={{ height: `${NAVBAR_APP_HEIGHT_PX}px` }}
      aria-label="Main navigation"
    >
      <A
        href="/budget-visualizer/transactions"
        class="text-lg font-semibold text-foreground no-underline hover:text-brand transition-colors"
      >
        Budget Visualizer
      </A>

      <div class="flex items-center gap-2">
        <Show
          when={authState.isUserAuthenticated}
          fallback={
            <button
              type="button"
              class="flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-md border-none bg-transparent font-[inherit] transition-colors hover:bg-brand/15"
              onClick={goLogin}
              aria-label="Log in"
            >
              <div
                class="size-8 rounded-full flex items-center justify-center transition-colors bg-muted"
                role="img"
                aria-hidden="true"
              >
                <svg class="size-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <span class="text-foreground text-sm" data-testid="navbar-login-label">
                Log In
              </span>
            </button>
          }
        >
          <UserNavDropdown />
        </Show>
      </div>
    </nav>
  )
}
