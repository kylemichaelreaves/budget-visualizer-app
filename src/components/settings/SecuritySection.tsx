import { ChangePasswordForm } from '@components/settings/ChangePasswordForm'
import { SettingsSectionCard } from '@components/settings/SettingsSectionCard'

export function SecuritySection() {
  return (
    <div class="flex flex-col gap-4">
      <SettingsSectionCard
        title="Change password"
        description="Choose a strong, unique password you don't use elsewhere."
      >
        <ChangePasswordForm />
      </SettingsSectionCard>
    </div>
  )
}
