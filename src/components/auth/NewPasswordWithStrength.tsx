import { PasswordField, type PasswordFieldProps } from './PasswordField'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import type { Strength } from './passwordStrength'

export interface NewPasswordWithStrengthProps extends PasswordFieldProps {
  strength: Strength
  showRequirements: boolean
}

export function NewPasswordWithStrength(props: NewPasswordWithStrengthProps) {
  return (
    <div class="flex flex-col gap-2">
      <PasswordField
        id={props.id}
        label={props.label}
        placeholder={props.placeholder}
        value={props.value}
        onInput={props.onInput}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        show={props.show}
        onToggleShow={props.onToggleShow}
        error={props.error}
        success={props.success}
        focused={props.focused}
        disabled={props.disabled}
        testid={props.testid}
      />
      <PasswordStrengthIndicator strength={props.strength} showRequirements={props.showRequirements} />
    </div>
  )
}
