import { Show, type Component } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { AlertCircle } from 'lucide-solid'

export interface AuthTextFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onInput: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  disabled?: boolean
  focused: boolean
  hasError: boolean
  errorMessage: string | null
  icon: Component<{ class?: string; classList?: Record<string, boolean> }>
  autocomplete?: string
  inputType?: 'text' | 'email'
  testid?: string
}

export function AuthTextField(props: AuthTextFieldProps) {
  const inputType = () => props.inputType ?? 'text'

  return (
    <div class="flex flex-col gap-1.5">
      <label for={props.id} class="text-foreground text-sm font-medium">
        {props.label}
        <span class="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      </label>

      <div class="relative">
        <Dynamic
          component={props.icon}
          class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200"
          classList={{
            'text-destructive': props.hasError,
            'text-primary': props.focused && !props.hasError,
            'text-muted-foreground': !props.focused && !props.hasError,
          }}
        />
        <input
          id={props.id}
          type={inputType()}
          autocomplete={props.autocomplete}
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onFocus={() => props.onFocus()}
          onBlur={() => props.onBlur()}
          disabled={props.disabled}
          aria-invalid={props.hasError}
          data-testid={props.testid}
          class="w-full rounded-xl border bg-input-background px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          classList={{
            'border-destructive ring-2 ring-destructive/20': props.hasError,
            'border-primary ring-2 ring-primary/20': props.focused && !props.hasError,
            'border-border hover:border-primary/40': !props.focused && !props.hasError,
          }}
        />
        <Show when={props.hasError}>
          <AlertCircle class="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
        </Show>
      </div>

      <Show when={props.hasError && props.errorMessage}>
        <p role="alert" class="flex items-start gap-1.5 text-destructive text-[13px]">
          <AlertCircle class="h-3.5 w-3.5 mt-px shrink-0" />
          {props.errorMessage}
        </p>
      </Show>
    </div>
  )
}
