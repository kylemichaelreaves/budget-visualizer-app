import { A, useLocation } from '@solidjs/router'
import { createMemo, For } from 'solid-js'
import { authState } from '@stores/authStore'
import { userDisplayInitials } from '@utils/userInitials'
import { cn } from '@utils/cn'
import { Lock, User } from 'lucide-solid'

export type AccountSettingsSection = 'profile' | 'security'

export const ACCOUNT_SETTINGS_NAV: { key: AccountSettingsSection; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
]

export function sectionHref(s: AccountSettingsSection): string {
  return `/budget-visualizer/account?section=${s}`
}

export function parseAccountSection(search: string): AccountSettingsSection {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const raw = q.get('section')
  if (raw === 'profile' || raw === 'security') return raw
  return 'security'
}

export function AccountSettingsSidebar() {
  const loc = useLocation()
  const active = createMemo(() => parseAccountSection(loc.search))

  return (
    <aside class="flex flex-col gap-2">
      <div class="rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-3 text-center">
        <div class="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
          <span class="text-primary text-lg font-bold">{userDisplayInitials(authState.user)}</span>
        </div>
        <div class="flex flex-col gap-0.5 w-full min-w-0">
          <p class="text-foreground text-sm font-semibold truncate">
            {`${authState.user.firstName} ${authState.user.lastName}`.trim() || authState.user.username}
          </p>
          <p class="text-muted-foreground text-xs truncate">{authState.user.email || '—'}</p>
        </div>
      </div>

      <nav class="rounded-2xl border border-border bg-card overflow-hidden" aria-label="Account settings">
        <For each={ACCOUNT_SETTINGS_NAV}>
          {(item, i) => {
            const Icon = item.icon
            const isOn = () => active() === item.key
            return (
              <A
                href={sectionHref(item.key)}
                class={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left border-l-2 transition-all no-underline',
                  i() > 0 && 'border-t border-border',
                  isOn()
                    ? 'border-l-primary bg-primary/8 text-primary'
                    : 'border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon class={cn('h-4 w-4 shrink-0', isOn() ? 'text-primary' : 'text-muted-foreground')} />
                <span class={cn('text-[13px]', isOn() ? 'font-semibold' : 'font-medium')}>{item.label}</span>
              </A>
            )
          }}
        </For>
      </nav>
    </aside>
  )
}
