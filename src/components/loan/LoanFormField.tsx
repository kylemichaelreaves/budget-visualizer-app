import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import type { LoanFormType } from '@types'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { formatLoanDateInput, parseLoanDateInput } from './helpers/loanDateInput'

export type LoanFieldDef = {
  label: string
  prop: keyof LoanFormType
  placeholder: string
  type: 'number' | 'date'
  tooltip?: string
}

export default function LoanFormField(props: {
  field: LoanFieldDef
  model: LoanFormType
  onChange: (next: LoanFormType) => void
  /** Shown under the input; the caller decides when (e.g. only once the field is touched). */
  error?: string
}): JSX.Element {
  const value = () => props.model[props.field.prop]

  const numProps = createMemo(() => {
    const prop = props.field.prop
    if (prop === 'interestRate') return { min: 0, max: 100, step: 0.1 }
    if (prop === 'loanTerm') return { min: 0, step: 1 }
    return { min: 0, step: 0.01 }
  })

  const fieldId = () => `loan-${props.field.prop}`
  const errorId = () => `${fieldId()}-error`

  const wrap = (inner: JSX.Element) => (
    <div class="flex flex-col gap-1.5 my-2.5">
      <Label for={fieldId()} class="text-muted-foreground text-sm">
        {props.field.label}
      </Label>
      {props.field.tooltip ? (
        <span title={props.field.tooltip} class="text-xs text-muted-foreground/70">
          {props.field.tooltip}
        </span>
      ) : null}
      {inner}
      <Show when={props.error}>
        <p id={errorId()} class="text-xs text-destructive" data-testid={`${fieldId()}-error`}>
          {props.error}
        </p>
      </Show>
    </div>
  )

  const iso = () => {
    const d = value()
    return d instanceof Date ? formatLoanDateInput(d) : ''
  }

  return (
    <Show
      when={props.field.type === 'date'}
      fallback={wrap(
        <Input
          id={fieldId()}
          type="number"
          placeholder={props.field.placeholder}
          value={Number(value()) || ''}
          {...numProps()}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? errorId() : undefined}
          onInput={(e) => {
            const n = Number(e.currentTarget.value)
            const next = { ...props.model, [props.field.prop]: Number.isFinite(n) ? n : 0 }
            props.onChange(next as LoanFormType)
          }}
        />,
      )}
    >
      {wrap(
        <Input
          id={fieldId()}
          type="date"
          placeholder={props.field.placeholder}
          value={iso()}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? errorId() : undefined}
          onInput={(e) => {
            const next = { ...props.model, [props.field.prop]: parseLoanDateInput(e.currentTarget.value) }
            props.onChange(next as LoanFormType)
          }}
        />,
      )}
    </Show>
  )
}
