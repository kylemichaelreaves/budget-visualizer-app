import { useNavigate } from '@solidjs/router'
import { Show } from 'solid-js'
import { queryClient } from '@api/queryClient'
import { authState, logout } from '@stores/authStore'
import { userDisplayInitials } from '@utils/userInitials'
import { Badge } from '@components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { ChevronDown, LogOut, Settings } from 'lucide-solid'

export function UserNavDropdown() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    queryClient.clear()
    // Full page navigation (matches NavBar/Login + the unauthorized handler in
    // index.tsx) so any in-memory state outside the auth store is reset too.
    // `replace` so the back button doesn't return to the now-unauthenticated app.
    window.location.replace('/login')
  }

  function goAccountSettings() {
    navigate('/budget-visualizer/account?section=security')
  }

  const menuLabel = () =>
    `Account menu for ${authState.user.username}${authState.user.role === 'admin' ? ', administrator' : ''}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        class="flex items-center gap-1 cursor-pointer p-1.5 rounded-lg border-none bg-transparent font-[inherit] transition-colors hover:bg-brand/15"
        aria-label={menuLabel()}
        title={authState.user.username}
        data-testid="navbar-user-menu-trigger"
      >
        <div class="size-8 rounded-full shrink-0 bg-brand flex items-center justify-center text-brand-foreground text-xs font-semibold">
          {userDisplayInitials(authState.user)}
        </div>
        <Show when={authState.user.role === 'admin'}>
          <Badge variant="destructive" class="uppercase tracking-wide text-[0.65rem] shrink-0">
            admin
          </Badge>
        </Show>
        <ChevronDown class="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onSelect={goAccountSettings} data-testid="navbar-menu-account-settings">
          <Settings class="size-4 text-muted-foreground" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => handleLogout()}
          class="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
          data-testid="navbar-menu-logout"
        >
          <LogOut class="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
