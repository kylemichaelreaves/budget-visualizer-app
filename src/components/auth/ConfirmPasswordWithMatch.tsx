import { Show } from 'solid-js'
import { CheckCircle2 } from 'lucide-solid'
import { PasswordField, type PasswordFieldProps } from './PasswordField'

export interface ConfirmPasswordWithMatchProps extends PasswordFieldProps {
  showMatchSuccess?: boolean
  matchSuccessLabel?: string
}

export function ConfirmPasswordWithMatch(props: ConfirmPasswordWithMatchProps) {
  return (
    <div class="flex flex-col gap-1.5">
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
      <Show when={props.showMatchSuccess}>
        <p class="flex items-center gap-1.5 text-success text-[13px]">
          <CheckCircle2 class="h-3.5 w-3.5 shrink-0" />
          {props.matchSuccessLabel ?? 'Passwords match'}
        </p>
      </Show>
    </div>
  )
}
