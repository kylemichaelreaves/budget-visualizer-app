import { Show } from 'solid-js'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-solid'

export interface PasswordFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onInput: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  show: boolean
  onToggleShow: () => void
  error: string | null
  success?: boolean
  focused: boolean
  disabled: boolean
  testid: string
}

export function PasswordField(props: PasswordFieldProps) {
  const hasError = () => !!props.error
  const iconColor = () =>
    hasError()
      ? 'text-destructive'
      : props.success
        ? 'text-emerald-500'
        : props.focused
          ? 'text-primary'
          : 'text-muted-foreground'

  return (
    <div class="flex flex-col gap-1.5">
      <label for={props.id} class="text-foreground text-sm font-medium">
        {props.label}
        <span class="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      </label>

      <div class="relative">
        <Lock
          class={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200 ${iconColor()}`}
        />
        <input
          id={props.id}
          type={props.show ? 'text' : 'password'}
          autocomplete="new-password"
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onFocus={() => props.onFocus()}
          onBlur={() => props.onBlur()}
          disabled={props.disabled}
          aria-invalid={hasError()}
          data-testid={props.testid}
          class="w-full rounded-xl border bg-input-background px-4 py-3 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          classList={{
            'border-destructive ring-2 ring-destructive/20': hasError(),
            'border-emerald-500 ring-2 ring-emerald-500/20': !hasError() && !!props.success,
            'border-primary ring-2 ring-primary/20': props.focused && !hasError() && !props.success,
            'border-border hover:border-primary/40': !props.focused && !hasError() && !props.success,
          }}
        />

        <Show
          when={!hasError()}
          fallback={
            <AlertCircle class="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
          }
        >
          <button
            type="button"
            onClick={() => props.onToggleShow()}
            disabled={props.disabled}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
            aria-label={props.show ? 'Hide password' : 'Show password'}
          >
            <Show when={props.show} fallback={<Eye class="h-4 w-4" />}>
              <EyeOff class="h-4 w-4" />
            </Show>
          </button>
        </Show>
      </div>

      <Show when={hasError()}>
        <p role="alert" class="flex items-start gap-1.5 text-destructive text-[13px]">
          <AlertCircle class="h-3.5 w-3.5 mt-px shrink-0" />
          {props.error}
        </p>
      </Show>
    </div>
  )
}
