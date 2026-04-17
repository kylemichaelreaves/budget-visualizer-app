import { Show } from 'solid-js'
import { Mail, AlertCircle } from 'lucide-solid'

interface EmailFieldProps {
  id?: string
  /** Defaults to "Email address". */
  label?: string
  /** Helper shown when there is no error. Defaults to forgot-password copy. */
  helperText?: string
  /** `data-testid` on the error alert paragraph. Defaults to `forgot-password-error`. */
  errorTestId?: string
  value: string
  onInput: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  disabled?: boolean
  focused: boolean
  hasError: boolean
  errorMessage: string | null
  testid?: string
}

export function EmailField(props: EmailFieldProps) {
  const inputId = () => props.id ?? 'email-field'
  const errorId = () => `${inputId()}-error`
  const helperId = () => `${inputId()}-helper`
  const labelText = () => props.label ?? 'Email address'
  const helperText = () => props.helperText ?? "We'll send a secure reset link to this address."
  const errorTestId = () => props.errorTestId ?? 'forgot-password-error'

  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label for={inputId()} class="text-foreground text-sm font-medium">
          {labelText()}
          <span class="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        </label>
        <Show when={!props.hasError}>
          <span class="text-muted-foreground/70 text-xs">Required</span>
        </Show>
      </div>

      <div class="relative">
        <Mail
          class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200"
          classList={{
            'text-destructive': props.hasError,
            'text-primary': props.focused && !props.hasError,
            'text-muted-foreground': !props.focused && !props.hasError,
          }}
        />
        <input
          id={inputId()}
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onFocus={() => props.onFocus()}
          onBlur={() => props.onBlur()}
          disabled={props.disabled}
          aria-invalid={props.hasError}
          aria-describedby={props.hasError ? errorId() : helperId()}
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

      <div class="min-h-[18px]">
        <Show
          when={props.hasError}
          fallback={
            <p id={helperId()} class="text-muted-foreground text-[13px]">
              {helperText()}
            </p>
          }
        >
          <p
            id={errorId()}
            role="alert"
            class="flex items-start gap-1.5 text-destructive text-[13px]"
            data-testid={errorTestId()}
          >
            <AlertCircle class="h-3.5 w-3.5 mt-px shrink-0" />
            {props.errorMessage}
          </p>
        </Show>
      </div>
    </div>
  )
}
