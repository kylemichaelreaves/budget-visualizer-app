import { authState } from '@stores/authStore'
import { SettingsSectionCard } from '@components/settings/SettingsSectionCard'

export function ProfileSection() {
  const displayName = () =>
    `${authState.user.firstName} ${authState.user.lastName}`.trim() || authState.user.username

  return (
    <div class="flex flex-col gap-4">
      <SettingsSectionCard title="Personal information" description="Details from your account (read-only).">
        <div class="flex flex-col gap-4 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-muted-foreground text-xs font-medium">Display name</span>
              <span class="text-foreground">{displayName()}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-muted-foreground text-xs font-medium">Email</span>
              <span class="text-foreground">{authState.user.email || '—'}</span>
            </div>
          </div>
          <p class="text-muted-foreground text-xs leading-relaxed">
            Profile editing will use your API when user-update endpoints are wired for these fields.
          </p>
        </div>
      </SettingsSectionCard>
    </div>
  )
}
