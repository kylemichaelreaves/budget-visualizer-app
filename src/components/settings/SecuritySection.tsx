import { ChangePasswordForm } from '@components/settings/ChangePasswordForm'
import { SettingsSectionCard } from '@components/settings/SettingsSectionCard'
import { SettingsSwitch } from '@components/settings/SettingsSwitch'
import { Shield, Trash2 } from 'lucide-solid'

const inactiveBlockClass = 'pointer-events-none select-none opacity-[0.52] saturate-[0.65]'

export function SecuritySection() {
  return (
    <div class="flex flex-col gap-4">
      <SettingsSectionCard
        title="Change password"
        description="Choose a strong, unique password you don't use elsewhere."
      >
        <ChangePasswordForm />
      </SettingsSectionCard>

      <div class={inactiveBlockClass} aria-hidden="true">
        <SettingsSectionCard
          title="Two-factor authentication"
          description="Add a second layer of protection to your account."
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                <Shield class="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
              <div class="min-w-0">
                <p class="text-foreground text-sm font-medium">Authenticator app</p>
                <p class="text-muted-foreground mt-0.5 text-xs leading-snug">
                  Two-factor authentication is not enabled yet. This option will unlock when your
                  administrator turns it on for this app.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <SettingsSwitch checked={false} onChange={() => {}} disabled />
            </div>
          </div>
        </SettingsSectionCard>
      </div>
      <p class="sr-only">Two-factor authentication is not available yet.</p>

      <div class={inactiveBlockClass} aria-hidden="true">
        <SettingsSectionCard
          title="Danger zone"
          description="These actions are permanent and cannot be undone."
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3 min-w-0">
              <div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                <Trash2 class="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
              <div>
                <p class="text-foreground text-sm font-medium">Delete account</p>
                <p class="text-muted-foreground mt-0.5 text-xs leading-snug">
                  Account deletion is not implemented yet. This control will become available when
                  self-service deletion is supported.
                </p>
              </div>
            </div>
            <span
              class="inline-flex items-center justify-center gap-2 rounded-xl shrink-0 border border-destructive/40 bg-transparent px-4 py-2 text-sm font-medium text-destructive opacity-80"
              aria-hidden="true"
            >
              <Trash2 class="h-3.5 w-3.5" />
              Delete account
            </span>
          </div>
        </SettingsSectionCard>
      </div>
      <p class="sr-only">Account deletion in the danger zone is not available yet.</p>
    </div>
  )
}
