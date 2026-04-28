import { A, useLocation } from '@solidjs/router'
import { createMemo, For, Show } from 'solid-js'
import {
  ACCOUNT_SETTINGS_NAV,
  AccountSettingsSidebar,
  parseAccountSection,
  sectionHref,
  type AccountSettingsSection,
} from '@components/settings/AccountSettingsSidebar'
import { ProfileSection } from '@components/settings/ProfileSection'
import { SecuritySection } from '@components/settings/SecuritySection'
import { cn } from '@utils/cn'
import { ChevronLeft } from 'lucide-solid'

const SECTION_LABEL: Record<AccountSettingsSection, string> = {
  profile: 'Profile',
  security: 'Security',
}

export default function AccountSettingsPage() {
  const loc = useLocation()
  const section = createMemo(() => parseAccountSection(loc.search))

  return (
    <div class="max-w-5xl w-full">
      <div class="flex flex-col gap-2 mb-6">
        <A
          href="/budget-visualizer/transactions"
          class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm no-underline w-fit group"
        >
          <ChevronLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </A>
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span class="text-foreground font-semibold">Account settings</span>
          <span aria-hidden="true">/</span>
          <span>{SECTION_LABEL[section()]}</span>
        </div>
      </div>

      <div class="flex lg:hidden items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        <For each={ACCOUNT_SETTINGS_NAV}>
          {(item) => {
            const Icon = item.icon
            const active = () => section() === item.key
            return (
              <A
                href={sectionHref(item.key)}
                class={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0 border transition-all text-xs font-medium no-underline',
                  active()
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/20',
                )}
              >
                <Icon class="h-3.5 w-3.5" />
                {item.label}
              </A>
            )
          }}
        </For>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <div class="hidden lg:block">
          <AccountSettingsSidebar />
        </div>

        <div class="min-w-0">
          <Show when={section() === 'profile'}>
            <ProfileSection />
          </Show>
          <Show when={section() === 'security'}>
            <SecuritySection />
          </Show>
        </div>
      </div>
    </div>
  )
}
