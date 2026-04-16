import { For, Show } from 'solid-js'
import { Check } from 'lucide-solid'
import { REQUIREMENTS, SEG_COLORS, LABEL_COLORS, type Strength } from './passwordStrength'

interface PasswordStrengthIndicatorProps {
  strength: Strength
  showRequirements: boolean
}

export function PasswordStrengthIndicator(props: PasswordStrengthIndicatorProps) {
  return (
    <>
      <Show when={props.strength.level !== 'none'}>
        <div class="flex flex-col gap-1.5">
          <div
            class="flex gap-1.5"
            role="meter"
            aria-label={`Password strength: ${props.strength.label}`}
            aria-valuenow={props.strength.score}
            aria-valuemin={0}
            aria-valuemax={3}
          >
            <For each={[1, 2, 3] as const}>
              {(s) => (
                <div
                  class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                  classList={{
                    [SEG_COLORS[props.strength.level]]: s <= props.strength.score,
                    'bg-muted': s > props.strength.score,
                  }}
                />
              )}
            </For>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground/70 text-xs">Strength</span>
            <span
              class={`text-xs font-medium transition-colors duration-300 ${LABEL_COLORS[props.strength.level]}`}
            >
              {props.strength.label}
            </span>
          </div>
        </div>
      </Show>

      <Show when={props.showRequirements}>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <For each={REQUIREMENTS}>
            {(req) => (
              <span
                class="flex items-center gap-1.5 transition-colors duration-200 text-xs"
                classList={{
                  'text-emerald-600 dark:text-emerald-400': props.strength.checks[req.key],
                  'text-muted-foreground/70': !props.strength.checks[req.key],
                }}
              >
                <span
                  class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-200"
                  classList={{
                    'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400':
                      props.strength.checks[req.key],
                    'border-muted-foreground/30': !props.strength.checks[req.key],
                  }}
                >
                  <Show when={props.strength.checks[req.key]}>
                    <Check class="h-2 w-2 text-white dark:text-black" stroke-width={3} />
                  </Show>
                </span>
                {req.label}
              </span>
            )}
          </For>
        </div>
      </Show>
    </>
  )
}
